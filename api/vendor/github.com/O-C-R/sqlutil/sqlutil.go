package sqlutil

import (
	"errors"
	"fmt"
	"reflect"
	"strings"
)

const (
	FieldNameStructTag       = "db"
	FieldExpressionStructTag = "sql"
)

var (

	// Errors.
	TypeError = errors.New("backend: struct value required")
)

// elemType returns the reflect type object and package-namespaced name
// corresponding to the given value. If the the value is not a struct or
// pointer to a struct, an error is returned.
func elemType(value interface{}) (reflect.Type, string, error) {
	valueType := reflect.TypeOf(value)

	if kind := valueType.Kind(); kind == reflect.Ptr {
		valueType = valueType.Elem()
	}

	if valueType.Kind() != reflect.Struct {
		return nil, "", TypeError
	}

	valueName := fmt.Sprintf("%s.%s", valueType.PkgPath(), valueType.Name())
	return valueType, valueName, nil
}

type sqlSelectStatement struct {
	table            string
	fields           []string
	fieldExpressions map[string]string
}

func (s *sqlSelectStatement) selectStatement(omit map[string]bool, remainder string) string {

	columns := make([]string, len(s.fields))
	for i, field := range s.fields {

		if omit != nil && omit[field] {
			columns[i] = fmt.Sprintf("NULL AS %s", field)
			continue
		}

		if fieldExpression, ok := s.fieldExpressions[field]; ok {
			columns[i] = fmt.Sprintf("%s AS %s", fieldExpression, field)
			continue
		}

		columns[i] = fmt.Sprintf("%s.%s", s.table, field)
	}

	columnsList := strings.Join(columns, ", ")
	selectStatement := fmt.Sprintf("SELECT %s FROM %s", columnsList, s.table)
	if remainder != "" {
		selectStatement = fmt.Sprintf("%s %s", selectStatement, remainder)
	}

	return selectStatement
}

var (
	sqlSelectStatements = make(map[string]*sqlSelectStatement)
)

// Register generates and caches a SQL select statement (string) for the given
// value and table. The value must be a struct or a pointer to a struct.
// Because this method is intended to be called during init(), it will panic
// on any error.
func Register(value interface{}, table string) {
	valueType, valueName, err := elemType(value)
	if err != nil {
		panic(err)
	}

	// Check to see if this type has already been registered.
	if _, ok := sqlSelectStatements[valueName]; ok {
		panic(fmt.Errorf("backend: previously registered type, %s", valueType))
	}

	valueNumFields := valueType.NumField()
	s := &sqlSelectStatement{
		table:            table,
		fields:           make([]string, 0, valueNumFields),
		fieldExpressions: make(map[string]string),
	}

	for i := 0; i < valueNumFields; i++ {
		field := valueType.Field(i)

		fieldName := field.Tag.Get(FieldNameStructTag)
		if fieldName == "" {
			continue
		}

		s.fields = append(s.fields, fieldName)

		if fieldExpression := field.Tag.Get(FieldExpressionStructTag); fieldExpression != "" {
			s.fieldExpressions[fieldName] = fieldExpression
		}
	}

	sqlSelectStatements[valueName] = s
}

func lookupSqlSelectStatement(value interface{}) (*sqlSelectStatement, error) {
	_, valueName, err := elemType(value)
	if err != nil {
		return nil, err
	}

	// Lookup a select statement based on the value name.
	s, ok := sqlSelectStatements[valueName]
	if !ok {
		return nil, fmt.Errorf("backend: unregistered type, %s", valueName)
	}

	return s, nil
}

// Selector represents an object that provides its own select statement given
// a remainder.
type Selector interface {
	Select(omit map[string]bool, remainder string) (string, error)
}

// Select returns the select statement corresponding to a given registered
// value or Selector instance.
func Select(value interface{}, omit map[string]bool, remainder string) (string, error) {

	// Defer to a Selector method if possible.
	if selector, ok := value.(Selector); ok {
		return selector.Select(omit, remainder)
	}

	// Lookup a select statement.
	s, err := lookupSqlSelectStatement(value)
	if err != nil {
		return "", err
	}

	return s.selectStatement(omit, remainder), nil
}

func Table(value interface{}) (string, error) {

	// Lookup a select statement.
	s, err := lookupSqlSelectStatement(value)
	if err != nil {
		return "", err
	}

	return s.table, nil
}
