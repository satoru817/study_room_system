package org.example.studyroomreservation.config.dialect;

import org.hibernate.boot.model.FunctionContributions;
import org.hibernate.dialect.MySQLDialect;
import org.hibernate.query.sqm.function.FunctionKind;
import org.hibernate.query.sqm.function.PatternBasedSqmFunctionDescriptor;
import org.hibernate.query.sqm.function.SqmFunctionDescriptor;
import org.hibernate.query.sqm.function.SqmFunctionRegistry;
import org.hibernate.query.sqm.produce.function.*;


import org.hibernate.query.sqm.produce.function.internal.PatternRenderer;
import org.hibernate.type.StandardBasicTypes;

import static org.hibernate.query.sqm.function.FunctionKind.AGGREGATE;

public class CustomMySQLDialect extends MySQLDialect {

    @Override
    public void initializeFunctionRegistry(FunctionContributions functionContributions) {
        super.initializeFunctionRegistry(functionContributions);

        SqmFunctionRegistry functionRegistry = functionContributions.getFunctionRegistry();

        // registering group_concat
        functionRegistry.registerPattern(
                "group_concat",
                "group_concat(?1)",
                functionContributions.getTypeConfiguration().getBasicTypeRegistry().resolve(StandardBasicTypes.STRING)
        );
    }
}
