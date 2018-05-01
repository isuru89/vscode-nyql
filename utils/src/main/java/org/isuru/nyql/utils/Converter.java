package org.isuru.nyql.utils;

import com.virtusa.gto.nyql.utils.QUtils;
import net.sf.jsqlparser.JSQLParserException;
import net.sf.jsqlparser.expression.CaseExpression;
import net.sf.jsqlparser.expression.CastExpression;
import net.sf.jsqlparser.expression.DateValue;
import net.sf.jsqlparser.expression.DoubleValue;
import net.sf.jsqlparser.expression.Expression;
import net.sf.jsqlparser.expression.Function;
import net.sf.jsqlparser.expression.JdbcNamedParameter;
import net.sf.jsqlparser.expression.JdbcParameter;
import net.sf.jsqlparser.expression.LongValue;
import net.sf.jsqlparser.expression.NullValue;
import net.sf.jsqlparser.expression.Parenthesis;
import net.sf.jsqlparser.expression.StringValue;
import net.sf.jsqlparser.expression.TimeValue;
import net.sf.jsqlparser.expression.TimestampValue;
import net.sf.jsqlparser.expression.WhenClause;
import net.sf.jsqlparser.expression.operators.arithmetic.Addition;
import net.sf.jsqlparser.expression.operators.arithmetic.BitwiseAnd;
import net.sf.jsqlparser.expression.operators.arithmetic.BitwiseOr;
import net.sf.jsqlparser.expression.operators.arithmetic.BitwiseXor;
import net.sf.jsqlparser.expression.operators.arithmetic.Concat;
import net.sf.jsqlparser.expression.operators.arithmetic.Division;
import net.sf.jsqlparser.expression.operators.arithmetic.Modulo;
import net.sf.jsqlparser.expression.operators.arithmetic.Multiplication;
import net.sf.jsqlparser.expression.operators.arithmetic.Subtraction;
import net.sf.jsqlparser.expression.operators.conditional.AndExpression;
import net.sf.jsqlparser.expression.operators.conditional.OrExpression;
import net.sf.jsqlparser.expression.operators.relational.Between;
import net.sf.jsqlparser.expression.operators.relational.EqualsTo;
import net.sf.jsqlparser.expression.operators.relational.ExpressionList;
import net.sf.jsqlparser.expression.operators.relational.GreaterThan;
import net.sf.jsqlparser.expression.operators.relational.GreaterThanEquals;
import net.sf.jsqlparser.expression.operators.relational.InExpression;
import net.sf.jsqlparser.expression.operators.relational.IsNullExpression;
import net.sf.jsqlparser.expression.operators.relational.LikeExpression;
import net.sf.jsqlparser.expression.operators.relational.MinorThan;
import net.sf.jsqlparser.expression.operators.relational.MinorThanEquals;
import net.sf.jsqlparser.expression.operators.relational.NotEqualsTo;
import net.sf.jsqlparser.parser.CCJSqlParserUtil;
import net.sf.jsqlparser.schema.Column;
import net.sf.jsqlparser.schema.Table;
import net.sf.jsqlparser.statement.Statement;
import net.sf.jsqlparser.statement.delete.Delete;
import net.sf.jsqlparser.statement.insert.Insert;
import net.sf.jsqlparser.statement.select.AllColumns;
import net.sf.jsqlparser.statement.select.AllTableColumns;
import net.sf.jsqlparser.statement.select.Join;
import net.sf.jsqlparser.statement.select.Limit;
import net.sf.jsqlparser.statement.select.OrderByElement;
import net.sf.jsqlparser.statement.select.PlainSelect;
import net.sf.jsqlparser.statement.select.Select;
import net.sf.jsqlparser.statement.select.SelectBody;
import net.sf.jsqlparser.statement.select.SelectExpressionItem;
import net.sf.jsqlparser.statement.select.SelectItem;
import net.sf.jsqlparser.statement.select.SetOperation;
import net.sf.jsqlparser.statement.select.SetOperationList;
import net.sf.jsqlparser.statement.select.SubSelect;
import net.sf.jsqlparser.statement.select.UnionOp;
import net.sf.jsqlparser.statement.update.Update;

import java.io.File;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * @author iweerarathna
 */
class Converter {

    public static void main(String[] args) {
        Map<String, String> map = new HashMap<String, String>();
        map.put("content", "SELECT \n" +
                "    (SELECT count(*) FROM s_comment comment\n" +
                "        LEFT OUTER JOIN s_comment_seen_by seen on seen.comment_sid = comment.sid AND seen.user_sid = 25066 \n" +
                "        WHERE comment.discussion_sid = discussion.sid AND seen.user_sid IS NULL)\n" +
                "     AS unseenComments,\n" +
                "    (SELECT count(*) as allCommentCount FROM s_comment comment\n" +
                "        WHERE comment.discussion_sid = discussion.sid)\n" +
                "     AS totalComments\n" +
                "  FROM s_discussion discussion\n" +
                "WHERE discussion.code = 'work-item-460065'");
        System.out.println(process(map));
    }

    static Object process(Map<String, String> input) {
        Object content = input.get("content");
        String sqlContent;
        if (content == null || content.toString().trim().isEmpty()) {
            String file = input.get("file");
            sqlContent = NHelper.toContentStr(new File(file));
        } else {
            sqlContent = content.toString();
        }

        try {
            Statement stmt = CCJSqlParserUtil.parse(sqlContent);
            Map<String, Object> dsl = new HashMap<String, Object>();
            StringBuilder str;
            if (stmt instanceof Insert) {
                str = visit((Insert)stmt);
            } else if (stmt instanceof Select) {
                str = visit((Select)stmt);
            } else if (stmt instanceof Update) {
                str = visit((Update)stmt);
            } else if (stmt instanceof Delete) {
                str = visit((Delete)stmt);
            } else {
                str = new StringBuilder();
                dsl.put("warn", "unknown sql statement!");
            }
            dsl.put("dsl", str.toString());
            return dsl;

        } catch (JSQLParserException e) {
            Map<String, Object> err = new HashMap<String, Object>();
            e.printStackTrace();
            err.put("error", true);
            err.put("errorKind", e.getClass().getSimpleName());
            err.put("errorMessage", e.getMessage());
            return err;
        }
    }

    private static StringBuilder visit(Delete delete) {
        StringBuilder dsl = new StringBuilder();
        dsl.append("$DSL.update {\n");

        Table table = delete.getTable();
        handleTarget(table, dsl);
        handleJoin(delete.getJoins(), dsl);

        if (delete.getWhere() != null) {
            handleWhere(delete.getWhere(), dsl);
        }

        dsl.append("\n}\n");
        return dsl;
    }

    private static StringBuilder visit(Insert insertStmt) {
        StringBuilder dsl = new StringBuilder();
        dsl.append("$DSL.insert {\n");

        Table table = insertStmt.getTable();
        handleTarget(table, dsl);

        if (QUtils.notNullNorEmpty(insertStmt.getColumns())) {
            dsl.append("SET {\n");
            ExpressionList expressionList = (ExpressionList) insertStmt.getItemsList();
            for (int i = 0; i < insertStmt.getColumns().size(); i++) {
                Column column = insertStmt.getColumns().get(i);
                Expression expression = expressionList.getExpressions().get(i);

                dsl.append("\t\"");
                toColumn(column, dsl);
                dsl.append("\": ");
                resolveExpr(expression, dsl);
                dsl.append("\n");
            }
            dsl.append("}\n");
        }

        dsl.append("\n}\n");
        return dsl;
    }

    private static void handleJoin(List<Join> joins, StringBuilder dsl) {
        if (joins == null) {
            return;
        }

        dsl.append("\nJOIN {\n\t");
        int count = 0;
        for (Join j : joins) {
            if (j.isLeft()) dsl.append("LEFT_");
            else if (j.isRight()) dsl.append("RIGHT_");
            else if (j.isFull()) dsl.append("FULL_");
            else if (j.isCross()) dsl.append("CROSS_");

            dsl.append("JOIN ");

            if (j.getRightItem() instanceof Table) {
                dsl.append("(").append(toTable((Table)j.getRightItem(), true)).append(") ");
            }

            Expression onExpression = j.getOnExpression();
            if (onExpression != null) {
                dsl.append("ON ");
                if (onExpression instanceof EqualsTo
                        && ((EqualsTo) onExpression).getLeftExpression() instanceof Column
                        && ((EqualsTo) onExpression).getRightExpression() instanceof Column) {
                    resolveExpr(((EqualsTo) onExpression).getLeftExpression(), dsl);
                    dsl.append(", ");
                    resolveExpr(((EqualsTo) onExpression).getRightExpression(), dsl);
                } else {
                    dsl.append("{");
                    resolveExpr(onExpression, dsl);
                    dsl.append("}");
                }

            }
            count++;
            dsl.append("\n\t");
        }


        dsl.append("\n}\n");
    }

    private static StringBuilder visit(Update updateStmt) {
        StringBuilder dsl = new StringBuilder();
        dsl.append("$DSL.update {\n");

        Table table = updateStmt.getTables().get(0);
        handleTarget(table, dsl);
        handleJoin(updateStmt.getJoins(), dsl);

        if (QUtils.notNullNorEmpty(updateStmt.getColumns())) {
            dsl.append("SET {\n");
            for (int i = 0; i < updateStmt.getColumns().size(); i++) {
                Column column = updateStmt.getColumns().get(i);
                Expression expression = updateStmt.getExpressions().get(i);

                dsl.append("\tEQ (");
                toColumn(column, dsl);
                dsl.append(", ");
                resolveExpr(expression, dsl);
                dsl.append(")\n");
            }
            dsl.append("}\n");
        }

        if (updateStmt.getWhere() != null) {
            handleWhere(updateStmt.getWhere(), dsl);
        }

        dsl.append("\n}\n");
        return dsl;
    }

    private static StringBuilder visit(Select select) {
        StringBuilder dsl = new StringBuilder();
        SelectBody body = select.getSelectBody();
        return visitBody(body, dsl, true);
    }

    private static StringBuilder visit(PlainSelect plainSelect, boolean appendDSLSel) {
        StringBuilder dsl = new StringBuilder();
        if (appendDSLSel) dsl.append("\n$DSL.select {\n");
        //PlainSelect plainSelect = (PlainSelect) selectStmt.getSelectBody();

        Table table = (Table) plainSelect.getFromItem();
        handleTarget(table, dsl);

        handleJoin(plainSelect.getJoins(), dsl);

        if (QUtils.notNullNorEmpty(plainSelect.getSelectItems())) {
            dsl.append("\nFETCH (");
            int c = 0;
            for (SelectItem selectItem : plainSelect.getSelectItems()) {
                if (c > 0) dsl.append(", ");
                if (selectItem instanceof AllColumns) {
                    continue;
                } else if (selectItem instanceof AllTableColumns) {
                    dsl.append(toTable(((AllTableColumns) selectItem).getTable(), false));
                } else if (selectItem instanceof SelectExpressionItem) {
                    boolean hasAls = ((SelectExpressionItem) selectItem).getAlias() != null;
                    if (hasAls) dsl.append("(");
                    resolveExpr(((SelectExpressionItem) selectItem).getExpression(), dsl);
                    if (hasAls) dsl.append(")");
                    if (hasAls) {
                        dsl.append(".alias(").append(quote(((SelectExpressionItem) selectItem).getAlias().getName())).append(")");
                    }
                }

                c++;
            }
            dsl.append(")\n");
        }

        if (plainSelect.getIntoTables() != null) {
            Table intoTable = plainSelect.getIntoTables().get(0);
            dsl.append("\nINTO (").append(toTable(intoTable, true)).append(")\n");
        }

        if (plainSelect.getWhere() != null) {
            handleWhere(plainSelect.getWhere(), dsl);
        }

        if (plainSelect.getGroupByColumnReferences() != null) {
            dsl.append("\nGROUP_BY (");
            int c = 0;
            for (Expression e : plainSelect.getGroupByColumnReferences()) {
                if (c > 0) dsl.append(", ");

                resolveExpr(e, dsl);
                c++;
            }
            dsl.append(")\n");
        }

        if (plainSelect.getHaving() != null) {
            dsl.append("HAVING {\n").append("\t");
            resolveExpr(plainSelect.getHaving(), dsl);
            dsl.append("\n}\n");
        }

        if (QUtils.notNullNorEmpty(plainSelect.getOrderByElements())) {
            dsl.append("ORDER_BY (");
            int c = 0;
            for (OrderByElement e : plainSelect.getOrderByElements()) {
                if (c > 0) dsl.append(", ");

                if (!e.isAsc()) dsl.append("DESC(");
                resolveExpr(e.getExpression(), dsl);
                if (!e.isAsc()) dsl.append(")");
                c++;
            }
            dsl.append(")\n");
        }

        if (plainSelect.getLimit() != null) {
            handleLimit(plainSelect.getLimit(), dsl);
        }

        if (appendDSLSel) dsl.append("\n}\n");
        return dsl;
    }


    private static StringBuilder visitBody(SelectBody selectBody, StringBuilder dsl, boolean appendDSLSel) {
        if (selectBody instanceof PlainSelect) {
            StringBuilder innerDsl = visit((PlainSelect)selectBody, appendDSLSel);
            dsl.append(innerDsl.toString());
            return dsl;
        } else if (selectBody instanceof SetOperationList) {
            List<SelectBody> plainSelects = ((SetOperationList) selectBody).getSelects();
            List<SetOperation> operations = ((SetOperationList) selectBody).getOperations();
            for (int i = 0; i < plainSelects.size(); i++) {
                visitBody(plainSelects.get(i), dsl, appendDSLSel);
            }
            SetOperation setOperation = operations.get(0);
            if (setOperation instanceof UnionOp) {
                UnionOp unionOp = (UnionOp)setOperation;
                if (unionOp.isDistinct()) {
                    dsl.append("\n$DSL.unionDistinct ( , )");
                } else {
                    dsl.append("\n$DSL.union (above_first_query, above_second_query)");
                }
            }

            return dsl;
        }
        return null;
    }


    private static void handleLimit(Limit limit, StringBuilder dsl) {
        if (limit.getRowCount() != null) {
            dsl.append("LIMIT ");
            resolveExpr(limit.getRowCount(), dsl);
            dsl.append("\n");
        }

        if (limit.getOffset() != null) {
            dsl.append("OFFSET ");
            resolveExpr(limit.getOffset(), dsl);
            dsl.append("\n");
        }
    }

    private static void handleWhere(Expression expression, StringBuilder dsl) {
        dsl.append("\nWHERE {\n");
        dsl.append("\t");
        resolveExpr(expression, dsl);
        dsl.append("\n}\n");
    }

    private static String toTable(Table table, boolean full) {
        if (full) {
            String tbName = "TABLE(" + quote(table.getName(), "'") + ")";
            if (table.getAlias() != null) {
                tbName = tbName + ".alias(" + quote(table.getAlias().getName(), "'") + ")";
            }
            return tbName;
        } else {
            if (table.getAlias() != null) {
                return table.getAlias().getName();
            } else {
                return "TABLE(" + quote(table.getName(), "'") + ")";
            }
        }
    }

    private static void resolveExpr(Expression expr, StringBuilder dsl) {
        if (expr instanceof Addition) {
            dsl.append("ADD(");
            resolveExpr(((Addition) expr).getLeftExpression(), dsl);
            dsl.append(", ");
            resolveExpr(((Addition) expr).getRightExpression(), dsl);
            dsl.append(")");
        } else if (expr instanceof AndExpression) {
            resolveExpr(((AndExpression) expr).getLeftExpression(), dsl);
            dsl.append("\nAND");
            boolean p = ((AndExpression) expr).getRightExpression() instanceof Parenthesis;
            if (p) dsl.append(" {\n"); else dsl.append("\n");
            resolveExpr(((AndExpression) expr).getRightExpression(), dsl);
            if (p) dsl.append("\n}");
        } else if (expr instanceof Between) {
            if (((Between) expr).isNot()) dsl.append("NOT");
            dsl.append("BETWEEN (");
            resolveExpr(((Between) expr).getLeftExpression(), dsl);
            dsl.append(", ");
            resolveExpr(((Between) expr).getBetweenExpressionStart(), dsl);
            dsl.append(", ");
            resolveExpr(((Between) expr).getBetweenExpressionEnd(), dsl);
            dsl.append(")");
        } else if (expr instanceof BitwiseAnd) {
            dsl.append("BITAND(");
            resolveExpr(((BitwiseAnd) expr).getLeftExpression(), dsl);
            dsl.append(", ");
            resolveExpr(((BitwiseAnd) expr).getRightExpression(), dsl);
            dsl.append(")");
        } else if (expr instanceof BitwiseOr) {
            dsl.append("BITOR(");
            resolveExpr(((BitwiseOr) expr).getLeftExpression(), dsl);
            dsl.append(", ");
            resolveExpr(((BitwiseOr) expr).getRightExpression(), dsl);
            dsl.append(")");
        } else if (expr instanceof BitwiseXor) {
            dsl.append("BITXOR(");
            resolveExpr(((BitwiseXor) expr).getLeftExpression(), dsl);
            dsl.append(", ");
            resolveExpr(((BitwiseXor) expr).getRightExpression(), dsl);
            dsl.append(")");
        } else if (expr instanceof CaseExpression) {
            dsl.append("CASE {");
            for (Expression e : ((CaseExpression) expr).getWhenClauses()) {
                resolveExpr(e, dsl);
            }
            if (((CaseExpression) expr).getElseExpression() != null) {
                dsl.append("ELSE {");
                resolveExpr(((CaseExpression) expr).getElseExpression(), dsl);
                dsl.append("}");
            }
            dsl.append("} ");
        } else if (expr instanceof CastExpression) {
            dsl.append("CAST(");
            resolveExpr(((CastExpression) expr).getLeftExpression(), dsl);
            dsl.append(", ").append(quote(((CastExpression) expr).getType().getDataType())).append(")");
        } else if (expr instanceof Column) {
            toColumn((Column)expr, dsl);
        } else if (expr instanceof Concat) {
            dsl.append("CONCAT(");
            resolveExpr(((Concat) expr).getLeftExpression(), dsl);
            dsl.append(",");
            resolveExpr(((Concat) expr).getRightExpression(), dsl);
            dsl.append(") ");
        } else if (expr instanceof Division) {
            dsl.append("DIVIDE(");
            resolveExpr(((Division) expr).getLeftExpression(), dsl);
            dsl.append(", ");
            resolveExpr(((Division) expr).getRightExpression(), dsl);
            dsl.append(")");
        } else if (expr instanceof DateValue) {
            dsl.append(quote(((DateValue) expr).getValue().toString()));
        } else if (expr instanceof DoubleValue) {
            dsl.append(((DoubleValue) expr).getValue());
        } else if (expr instanceof EqualsTo) {
            dsl.append("EQ (");
            resolveExpr(((EqualsTo) expr).getLeftExpression(), dsl);
            dsl.append(", ");
            resolveExpr(((EqualsTo) expr).getRightExpression(), dsl);
            dsl.append(") ");
        } else if (expr instanceof Function) {
            dsl.append(((Function) expr).getName().toUpperCase()).append("(");
            if (((Function) expr).getParameters() != null && ((Function) expr).getParameters().getExpressions() != null) {
                for (Expression e : ((Function) expr).getParameters().getExpressions()) {
                    resolveExpr(e, dsl);
                }
            }
            dsl.append(")");
        } else if (expr instanceof GreaterThan) {
            dsl.append("GT (");
            resolveExpr(((GreaterThan) expr).getLeftExpression(), dsl);
            dsl.append(", ");
            resolveExpr(((GreaterThan) expr).getRightExpression(), dsl);
            dsl.append(") ");
        } else if (expr instanceof GreaterThanEquals) {
            dsl.append("GTE (");
            resolveExpr(((GreaterThanEquals) expr).getLeftExpression(), dsl);
            dsl.append(", ");
            resolveExpr(((GreaterThanEquals) expr).getRightExpression(), dsl);
            dsl.append(") ");
        } else if (expr instanceof InExpression) {
            if (((InExpression) expr).isNot()) {
                dsl.append("N");
            }
            dsl.append("IN (");
            resolveExpr(((InExpression) expr).getLeftExpression(), dsl);
            dsl.append(", ");
            ExpressionList leftItemsList = (ExpressionList) ((InExpression) expr).getRightItemsList();
            if (leftItemsList != null) {
                int c = 0;
                for (Expression e : leftItemsList.getExpressions()) {
                    if (c > 0) dsl.append(", ");

                    resolveExpr(e, dsl);
                    c++;
                }
            }
            dsl.append(") ");
        } else if (expr instanceof IsNullExpression) {
            if (((IsNullExpression) expr).isNot()) dsl.append("NOTNULL (");
            else dsl.append("ISNULL (");
            resolveExpr(((IsNullExpression) expr).getLeftExpression(), dsl);
            dsl.append(") ");
        } else if (expr instanceof JdbcNamedParameter) {
            dsl.append("PARAM(").append(quote(((JdbcNamedParameter) expr).getName())).append(") ");
        } else if (expr instanceof JdbcParameter) {
            dsl.append("PARAM(").append(quote("<your-param-name-here-" + Integer.toHexString(expr.hashCode()) + ">")).append(") ");
        } else if (expr instanceof LikeExpression) {
            if (((LikeExpression) expr).isNot()) dsl.append("NOTLIKE (");
            else dsl.append("LIKE (");
            resolveExpr(((LikeExpression) expr).getLeftExpression(), dsl);
            dsl.append(", ");
            resolveExpr(((LikeExpression) expr).getRightExpression(), dsl);
            dsl.append(") ");
        } else if (expr instanceof LongValue) {
            dsl.append(((LongValue) expr).getValue());
        } else if (expr instanceof MinorThan) {
            dsl.append("LT (");
            resolveExpr(((MinorThan) expr).getLeftExpression(), dsl);
            dsl.append(", ");
            resolveExpr(((MinorThan) expr).getRightExpression(), dsl);
            dsl.append(") ");
        } else if (expr instanceof MinorThanEquals) {
            dsl.append("LTE (");
            resolveExpr(((MinorThanEquals) expr).getLeftExpression(), dsl);
            dsl.append(", ");
            resolveExpr(((MinorThanEquals) expr).getRightExpression(), dsl);
            dsl.append(") ");
        } else if (expr instanceof Modulo) {
            dsl.append("MODULUS(");
            resolveExpr(((Modulo) expr).getLeftExpression(), dsl);
            dsl.append(", ");
            resolveExpr(((Modulo) expr).getRightExpression(), dsl);
            dsl.append(")");
        } else if (expr instanceof Multiplication) {
            dsl.append("MULTIPLY(");
            resolveExpr(((Multiplication) expr).getLeftExpression(), dsl);
            dsl.append(", ");
            resolveExpr(((Multiplication) expr).getRightExpression(), dsl);
            dsl.append(")");
        } else if (expr instanceof NotEqualsTo) {
            dsl.append("NEQ (");
            resolveExpr(((NotEqualsTo) expr).getLeftExpression(), dsl);
            dsl.append(", ");
            resolveExpr(((NotEqualsTo) expr).getRightExpression(), dsl);
            dsl.append(") ");
        } else if (expr instanceof NullValue) {
            dsl.append("null");
        } else if (expr instanceof OrExpression) {
            resolveExpr(((OrExpression) expr).getLeftExpression(), dsl);
            dsl.append("\nOR");
            boolean p = ((OrExpression) expr).getRightExpression() instanceof Parenthesis;
            if (p) dsl.append(" {\n"); else dsl.append("\n");
            resolveExpr(((OrExpression) expr).getRightExpression(), dsl);
            if (p) dsl.append("\n}");
        } else if (expr instanceof Parenthesis) {
            resolveExpr(((Parenthesis) expr).getExpression(), dsl);
        } else if (expr instanceof SubSelect) {
            dsl.append("QUERY {");
            visitBody(((SubSelect) expr).getSelectBody(), dsl, false);
            dsl.append("}");
        } else if (expr instanceof StringValue) {
            dsl.append("STR(").append(quote(((StringValue) expr).getValue())).append(")");
        } else if (expr instanceof Subtraction) {
            dsl.append("MINUS(");
            resolveExpr(((Subtraction) expr).getLeftExpression(), dsl);
            dsl.append(", ");
            resolveExpr(((Subtraction) expr).getRightExpression(), dsl);
            dsl.append(")");
        } else if (expr instanceof TimeValue) {
            dsl.append(quote(((TimeValue) expr).getValue().toString()));
        } else if (expr instanceof TimestampValue) {
            dsl.append(quote(((TimestampValue) expr).getValue().toString()));
        } else if (expr instanceof WhenClause) {
            dsl.append("WHEN {");
            resolveExpr(((WhenClause) expr).getWhenExpression(), dsl);
            dsl.append("} THEN {");
            resolveExpr(((WhenClause) expr).getThenExpression(), dsl);
            dsl.append("} ");
        }
    }

    private static void handleTarget(Table table, StringBuilder dsl) {
        dsl.append("\nTARGET (TABLE(").append(quote(table.getName())).append(")");
        if (table.getAlias() != null) {
            dsl.append(".alias(").append(quote(table.getAlias().getName())).append(")");
        }
        dsl.append(")\n");
    }

    private static void toColumn(Column column, StringBuilder dsl) {
        if (column.getTable() != null && column.getTable().getName() != null) {
            dsl.append(column.getTable().getName()).append(".").append(column.getColumnName());
        } else {
            dsl.append(column.getColumnName());
        }
    }

    static String quote(String name) {
        return quote(name, "'");
    }

    static String quote(String name, String q) {
        return q + name + q;
    }


}
