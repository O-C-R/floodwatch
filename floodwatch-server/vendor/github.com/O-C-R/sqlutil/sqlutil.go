package sqlutil

import (
	"database/sql"
	"errors"
	"fmt"
	"reflect"
	"strings"
)

const (
	ColumnNameStructTag      = "db"
	FieldExpressionStructTag = "sql"
	IDColumnName             = "id"
)

var (
	TypeError = errors.New("sqlutil: type error")
)

type ValueFunc func(interface{}) (interface{}, error)

func elem(value interface{}) reflect.Value {
	valueElem := reflect.ValueOf(value)

	if kind := valueElem.Kind(); kind == reflect.Ptr {
		valueElem = valueElem.Elem()
	}

	return valueElem
}

func structElem(value interface{}) (reflect.Value, error) {
	valueElem := elem(value)
	if kind := valueElem.Kind(); kind != reflect.Struct {
		return valueElem, TypeError
	}

	return valueElem, nil
}

func fieldValues(fieldIndicies []string, value interface{}) ([]interface{}, error) {
	valueElem, err := structElem(value)
	if err != nil {
		return nil, err
	}

	fieldValues := make([]interface{}, len(fieldIndicies))
	for i, columnName := range fieldIndicies {
		elem := valueElem.FieldByName(columnName)
		if elem.Kind() != reflect.Ptr || !elem.IsNil() {
			fieldValues[i] = elem.Interface()
		}
	}

	return fieldValues, nil
}

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

	n := valueType.NumField()
	s := &sqlSelectStatement{
		table:            table,
		fields:           make([]string, 0, n),
		fieldExpressions: make(map[string]string),
	}

	for i := 0; i < n; i++ {
		field := valueType.Field(i)

		columnName := field.Tag.Get(ColumnNameStructTag)
		if columnName == "" {
			continue
		}

		s.fields = append(s.fields, columnName)

		if fieldExpression := field.Tag.Get(FieldExpressionStructTag); fieldExpression != "" {
			s.fieldExpressions[columnName] = fieldExpression
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

func execFunc(statement *sql.Stmt, fieldIndicies []string, idType reflect.Type) func(value interface{}) (interface{}, error) {
	return func(value interface{}) (interface{}, error) {
		valueFieldValues, err := fieldValues(fieldIndicies, value)
		if err != nil {
			return nil, err
		}

		if idType == nil {
			_, err := statement.Exec(valueFieldValues...)
			return nil, err
		}

		rowID := reflect.New(idType)
		if err := statement.QueryRow(valueFieldValues...).Scan(rowID.Interface()); err != nil {
			return nil, err
		}

		return rowID.Elem().Interface(), nil
	}
}

func insertQuery(value interface{}, table string, serial bool, conflictTargets ...string) (string, []string, reflect.Type, error) {
	var idType reflect.Type
	valueType := reflect.TypeOf(value)
	if kind := valueType.Kind(); kind != reflect.Struct {
		return "", nil, idType, TypeError
	}

	n := valueType.NumField()
	columnNames := make([]string, 0, n)
	arguments := make([]string, 0, n)
	fieldNames := make([]string, 0, n)
	for i := 0; i < n; i++ {
		field := valueType.Field(i)
		columnName := field.Tag.Get(ColumnNameStructTag)
		if columnName == "" {
			continue
		}

		if columnName == IDColumnName {
			idType = field.Type
			if serial {
				continue
			}
		}

		columnNames = append(columnNames, columnName)
		arguments = append(arguments, fmt.Sprintf("$%d", len(columnNames)))
		fieldNames = append(fieldNames, field.Name)
	}

	statement := fmt.Sprintf("INSERT INTO %s (%s) VALUES (%s)", table, strings.Join(columnNames, ", "), strings.Join(arguments, ", "))
	if len(conflictTargets) > 0 {
		updateValues := make([]string, 0, len(columnNames))
		for _, columnName := range columnNames {
			if columnName == IDColumnName {
				continue
			}

			updateValues = append(updateValues, fmt.Sprintf("%s = EXCLUDED.%s", columnName, columnName))
		}

		statement += fmt.Sprintf(" ON CONFLICT (%s) DO UPDATE SET %s", strings.Join(conflictTargets, ", "), strings.Join(updateValues, ", "))
	}

	if idType != nil {
		statement += fmt.Sprintf(" RETURNING %s", IDColumnName)
	}

	return statement, fieldNames, idType, nil
}

func InsertFunc(db *sql.DB, value interface{}, table string) (ValueFunc, error) {
	query, fieldIndicies, idType, err := insertQuery(value, table, false)
	if err != nil {
		return nil, err
	}

	statement, err := db.Prepare(query)
	if err != nil {
		return nil, err
	}

	return execFunc(statement, fieldIndicies, idType), nil
}

func InsertSerialFunc(db *sql.DB, value interface{}, table string) (ValueFunc, error) {
	query, fieldIndicies, idType, err := insertQuery(value, table, true)
	if err != nil {
		return nil, err
	}

	statement, err := db.Prepare(query)
	if err != nil {
		return nil, err
	}

	return execFunc(statement, fieldIndicies, idType), nil
}

func UpsertFunc(db *sql.DB, value interface{}, table string, conflictTargets ...string) (ValueFunc, error) {
	query, fieldIndicies, idType, err := insertQuery(value, table, false, conflictTargets...)
	if err != nil {
		return nil, err
	}

	statement, err := db.Prepare(query)
	if err != nil {
		return nil, err
	}

	return execFunc(statement, fieldIndicies, idType), nil
}

func UpsertSerialFunc(db *sql.DB, value interface{}, table string, conflictTargets ...string) (ValueFunc, error) {
	query, fieldIndicies, idType, err := insertQuery(value, table, true, conflictTargets...)
	if err != nil {
		return nil, err
	}

	statement, err := db.Prepare(query)
	if err != nil {
		return nil, err
	}

	return execFunc(statement, fieldIndicies, idType), nil
}

func updateQuery(value interface{}, table string, searchColumns ...string) (string, []string, reflect.Type, error) {
	var idType reflect.Type
	valueType := reflect.TypeOf(value)
	if kind := valueType.Kind(); kind != reflect.Struct {
		return "", nil, idType, TypeError
	}

	searchColumnLookup := make(map[string]int)
	for i, column := range searchColumns {
		searchColumnLookup[column] = i
	}

	n := valueType.NumField()
	arguments := make([]string, 0, n)
	searchArguments := make([]string, 0, n)
	columnNames := make([]string, 0, n)
	searchFieldNames := make([]string, 0, len(searchColumns))
	for i := 0; i < n; i++ {
		field := valueType.Field(i)
		columnName := field.Tag.Get(ColumnNameStructTag)
		if columnName == "" {
			continue
		}

		if _, ok := searchColumnLookup[columnName]; ok {
			searchArguments = append(searchArguments, fmt.Sprintf("%s = $%d", columnName, len(searchArguments)+len(arguments)+1))
			searchFieldNames = append(searchFieldNames, field.Name)
		}

		if columnName == IDColumnName {
			idType = field.Type
			continue
		}

		arguments = append(arguments, fmt.Sprintf("%s = $%d", columnName, len(searchArguments)+len(arguments)+1))
		columnNames = append(columnNames, field.Name)
	}

	statement := fmt.Sprintf("UPDATE %s SET %s WHERE %s", table, strings.Join(arguments, ", "), strings.Join(searchArguments, " AND "))
	if idType != nil {
		statement += fmt.Sprintf(" RETURNING %s", IDColumnName)
	}

	return statement, append(columnNames, searchFieldNames...), idType, nil
}

func UpdateFunc(db *sql.DB, value interface{}, table string, searchFields ...string) (ValueFunc, error) {
	query, fieldIndicies, idType, err := updateQuery(value, table, searchFields...)
	if err != nil {
		return nil, err
	}

	statement, err := db.Prepare(query)
	if err != nil {
		return nil, err
	}

	return execFunc(statement, fieldIndicies, idType), nil
}

func Table(value interface{}) (string, error) {

	// Lookup a select statement.
	s, err := lookupSqlSelectStatement(value)
	if err != nil {
		return "", err
	}

	return s.table, nil
}
