package session

import (
	"bytes"
	"encoding"
	"encoding/gob"
	"errors"
	"time"

	"github.com/garyburd/redigo/redis"
)

// Arguments: current unix timestamp (nanoseconds), rate (tokens per nanosecond), bucket capacity.
const tokenBucket = `
local bucket = redis.call('hmget', KEYS[1], '1', '2')
if(not bucket[1]) then
	bucket[1] = 0
end

if(not bucket[2]) then
	bucket[2] = tonumber(ARGV[2])
elseif(ARGV[3] > bucket[1]) then
	bucket[2] = math.min(ARGV[2], bucket[2] + (ARGV[3] - bucket[1]) * ARGV[1])
end

local ok = 0
if(bucket[2]>0) then
	bucket[2] = bucket[2] - 1
	ok = 1
end

redis.call('hmset', KEYS[1], '1', ARGV[3], '2', bucket[2])
redis.call('pexpire', KEYS[1], math.ceil((ARGV[2] - bucket[2]) / ARGV[1] / 1e3))

return ok
`

// Keys: sorted set name
// Arguments: max length, [timestamp, member]...
const addToCappedSortedSet = `
local desiredSize = tonumber(ARGV[1])

-- Swap in the key to the first param to zadd
ARGV[1] = KEYS[1]
redis.call('ZADD', unpack(ARGV))

if desiredSize > 0 then
	local size = redis.call('ZCARD', KEYS[1])
	local maxRank = size - desiredSize - 1
	if maxRank >= 0 then
		local deleted = redis.call('ZREMRANGEBYRANK', KEYS[1], 0, maxRank)
		return deleted
	end
end

return 0
`

// Keys: sessionKey, sessionToGroupKey
// Arguments: sessionId
const deleteSingleSession = `
redis.call('DEL', KEYS[1])
local groupKey = redis.call('GET', KEYS[2])
redis.call('DEL', KEYS[2])
local deleted = redis.call('ZREM', groupKey, ARGV[1])

return deleted
`

// Keys: sorted set name
// Arguments: prefixes
const deleteSortedSetAndKeys = `
local members = redis.call('ZRANGE', KEYS[1], 0, -1)

local toDelete = {}
local count = 0
for midx, member in ipairs(members) do
	for pidx, prefix in ipairs(ARGV) do
		table.insert(toDelete, prefix .. member)
		count = count + 1
	end
end

if count > 0 then
	redis.call('del', unpack(toDelete))
end

redis.call('del', KEYS[1])

return 0
`

var (
	InvalidStringError           = errors.New("Must provide a string-like object")
	NoSessionFoundError          = errors.New("No session found")
	RateLimitExceededError       = errors.New("rate limit exceeded")
	redisError                   = errors.New("redis error")
	tokenBucketScript            = redis.NewScript(1, tokenBucket)
	addToCappedSortedSetScript   = redis.NewScript(1, addToCappedSortedSet)
	deleteSingleSessionScript    = redis.NewScript(2, deleteSingleSession)
	deleteSortedSetAndKeysScript = redis.NewScript(1, deleteSortedSetAndKeys)
)

func interfaceToString(v interface{}) (string, error) {
	switch v := v.(type) {
	default:
		return "", InvalidStringError
	case string:
		return v, nil
	case []byte:
		return string(v), nil
	case encoding.TextMarshaler:
		bytes, err := v.MarshalText()
		if err != nil {
			return "", err
		}
		return string(bytes), nil
	}
}

func sessionKey(sessionID string) string {
	return "s" + sessionID
}

func sessionToGroupKey(sessionID string) string {
	return "z" + sessionID
}

func groupKey(groupId string) string {
	return "g" + groupId
}

func rateLimitKey(client string) string {
	return "b" + client
}

type SessionStoreOptions struct {
	Addr, Password  string
	SessionDuration time.Duration
	MaxSessions     int
}

type SessionStore struct {
	pool                                          *redis.Pool
	sessionDuration, rateLimitDuration, rateLimit int64
	maxSessions                                   int
}

func NewSessionStore(options SessionStoreOptions) (*SessionStore, error) {
	pool := &redis.Pool{
		MaxIdle:     3,
		IdleTimeout: 5 * time.Minute,
		Dial: func() (redis.Conn, error) {
			conn, err := redis.Dial("tcp", options.Addr)
			if err != nil {
				return nil, err
			}

			if options.Password != "" {
				if _, err := conn.Do("AUTH", options.Password); err != nil {
					conn.Close()
					return nil, err
				}
			}

			return conn, err
		},
		TestOnBorrow: func(conn redis.Conn, t time.Time) error {
			if time.Since(t) < time.Minute {
				return nil
			}

			_, err := conn.Do("PING")
			return err
		},
	}

	conn := pool.Get()
	defer conn.Close()

	// Load scripts
	if err := tokenBucketScript.Load(conn); err != nil {
		return nil, err
	}
	if err := addToCappedSortedSetScript.Load(conn); err != nil {
		return nil, err
	}
	if err := deleteSingleSessionScript.Load(conn); err != nil {
		return nil, err
	}
	if err := deleteSortedSetAndKeysScript.Load(conn); err != nil {
		return nil, err
	}

	return &SessionStore{
		pool:            pool,
		sessionDuration: int64(options.SessionDuration / time.Second),
		maxSessions:     options.MaxSessions,
	}, nil
}

func (r *SessionStore) Session(sessionID, session interface{}) error {
	conn := r.pool.Get()
	defer conn.Close()

	sessionIdStr, err := interfaceToString(sessionID)
	if err != nil {
		return err
	}

	reply, err := conn.Do("GET", sessionKey(sessionIdStr))
	if err != nil {
		return err
	}

	// Nil replies generate an error in redis.Bytes, head that off here.
	if reply == nil {
		return NoSessionFoundError
	}

	parsed, err := redis.Bytes(reply, err)
	if err != nil {
		return err
	}

	return gob.NewDecoder(bytes.NewBuffer(parsed)).Decode(session)
}

func (r *SessionStore) SetSession(sessionID, groupId, session interface{}) error {
	conn := r.pool.Get()
	defer conn.Close()

	encodedSession := bytes.NewBuffer([]byte{})
	if err := gob.NewEncoder(encodedSession).Encode(session); err != nil {
		return err
	}

	sessionIdStr, err := interfaceToString(sessionID)
	if err != nil {
		return err
	}
	sKey := sessionKey(sessionIdStr)

	conn.Send("MULTI")

	if err := conn.Send("SETEX", sKey, r.sessionDuration, encodedSession); err != nil {
		return err
	}

	if groupId != nil {
		groupIdStr, err := interfaceToString(groupId)
		if err != nil {
			return err
		}

		gKey := groupKey(groupIdStr)
		sgKey := sessionToGroupKey(sessionIdStr)

		if err := conn.Send("SETEX", sgKey, r.sessionDuration, gKey); err != nil {
			return err
		}

		if err := addToCappedSortedSetScript.Send(conn, gKey, r.maxSessions, time.Now().UnixNano(), sessionIdStr); err != nil {
			return err
		}
	}

	res, err := redis.Values(conn.Do("EXEC"))
	if err != nil {
		return err
	}
	for _, elem := range res {
		if err, ok := elem.(error); ok {
			return err
		}
	}

	return nil
}

func (r *SessionStore) InvalidateSessions(groupId interface{}) error {
	conn := r.pool.Get()
	defer conn.Close()

	groupIdStr, err := interfaceToString(groupId)
	if err != nil {
		return err
	}
	gKey := groupKey(groupIdStr)

	if _, err := deleteSortedSetAndKeysScript.Do(conn, gKey, "s", "z"); err != nil {
		return err
	}

	return nil
}

func (r *SessionStore) DeleteSession(sessionID interface{}) error {
	conn := r.pool.Get()
	defer conn.Close()

	sessionIdStr, err := interfaceToString(sessionID)
	if err != nil {
		return err
	}
	sKey := sessionKey(sessionIdStr)
	sgKey := sessionToGroupKey(sessionIdStr)

	if _, err := deleteSingleSessionScript.Do(conn, sKey, sgKey, sessionIdStr); err != nil {
		return err
	}

	return nil
}

func (r *SessionStore) RateLimitCount(client string, bucketRate, bucketCapacity float64) error {
	conn := r.pool.Get()
	defer conn.Close()

	ok, err := redis.Int(tokenBucketScript.Do(conn, rateLimitKey(client), bucketRate, bucketCapacity, time.Now().UnixNano()))
	if err != nil {
		return err
	}

	if ok == 0 {
		return RateLimitExceededError
	}

	return nil
}
