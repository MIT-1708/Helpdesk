"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateBody = void 0;
const validateBody = (schema) => (req, res, next) => {
    const validation = schema.safeParse(req.body);
    if (!validation.success) {
        return res.status(400).json({
            error: validation.error.issues[0]?.message || 'Invalid input data.',
        });
    }
    req.body = validation.data;
    next();
};
exports.validateBody = validateBody;
