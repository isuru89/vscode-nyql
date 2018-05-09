package org.isuru.nyql.utils;

import net.sf.jsqlparser.JSQLParserException;
import net.sf.jsqlparser.expression.JdbcParameter;
import net.sf.jsqlparser.parser.CCJSqlParserUtil;
import net.sf.jsqlparser.statement.Statement;
import net.sf.jsqlparser.util.deparser.ExpressionDeParser;
import net.sf.jsqlparser.util.deparser.SelectDeParser;
import net.sf.jsqlparser.util.deparser.StatementDeParser;
import org.json.simple.parser.JSONParser;
import org.json.simple.parser.ParseException;

import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Queue;
import java.util.concurrent.ArrayBlockingQueue;

/**
 * @author iweerarathna
 */
class ParamReplacer {

    private static final JSONParser PARSER = new JSONParser();

    @SuppressWarnings("unchecked")
    static Object process(Map<String, String> input) throws ParseException, IOException {
        Map<String, Object> map = new HashMap<>();
        String query = input.get("q");
        String ps = input.get("ps");
        String porder = input.get("order");
        if (porder == null) {
            return map;
        }
        List<Map<String, Object>> order = (List<Map<String, Object>>) PARSER.parse(porder);
        Map<String, Object> p = (Map<String, Object>) PARSER.parse(ps);

        StringBuilder buffer = new StringBuilder();
        ExpressionDeParser expr = new ReplaceParameters(p, order);

        SelectDeParser selectDeparser = new SelectDeParser(expr, buffer);
        expr.setSelectVisitor(selectDeparser);
        expr.setBuffer(buffer);
        StatementDeParser stmtDeparser = new StatementDeParser(expr, selectDeparser, buffer);

        try {
            Statement stmt = CCJSqlParserUtil.parse(query);

            stmt.accept(stmtDeparser);
            String q = stmtDeparser.getBuffer().toString();
            map.put("query", q);
            return map;
        } catch (JSQLParserException e) {
            throw new IOException(e.getMessage(), e);
        }
    }

    static class ReplaceParameters extends ExpressionDeParser {
        Queue<Map<String, Object>> order;
        Map<String, Object> ps;

        private ReplaceParameters(Map<String, Object> allPs, List<Map<String, Object>> order) {
            ps = new HashMap<>(allPs);
            this.order = new ArrayBlockingQueue<>(order.size());
            for (Map<String, Object> item : order) {
                this.order.offer(item);
            }
        }

        @Override
        public void visit(JdbcParameter jdbcParameter) {
            Map<String, Object> poll = order.poll();
            String name = poll.get("name").toString();
            if (!ps.containsKey(name)) {
                throw new IllegalArgumentException("No parameter is set for '" + name + "'!");
            }
            Object val = ps.get(name);
            if (val == null) {
                this.getBuffer().append("NULL");
            } else if (Boolean.class.isAssignableFrom(val.getClass())) {
                boolean bl = (boolean)val;
                this.getBuffer().append(bl ? "1" : "0");    // TODO consider db type
            } else if (String.class.isAssignableFrom(val.getClass())) {
                this.getBuffer().append("'").append(val.toString()).append("'"); // TODO consider db type
            } else if (Number.class.isAssignableFrom(val.getClass())) {
                this.getBuffer().append(val);
            } else {
                throw new IllegalArgumentException("Unknown argument!");
            }
        }
    }
}
