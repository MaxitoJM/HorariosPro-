function getFirstValidationMessage(fieldErrors) {
    const messages = Object.values(fieldErrors)
        .flat()
        .filter(Boolean);
    return messages.length > 0 ? messages[0] : "Datos de entrada invalidos";
}
export function validate(schema) {
    return (req, _res, next) => {
        const parsed = schema.safeParse({
            body: req.body,
            query: req.query,
            params: req.params
        });
        if (!parsed.success) {
            const flattened = parsed.error.flatten();
            return next({
                statusCode: 400,
                code: "VALIDATION_ERROR",
                message: getFirstValidationMessage(flattened.fieldErrors),
                details: flattened
            });
        }
        req.body = parsed.data.body;
        req.query = parsed.data.query;
        req.params = parsed.data.params;
        return next();
    };
}
