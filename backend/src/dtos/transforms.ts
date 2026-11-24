// Transforms of class-transformer shared by the DTOs of every module

// Removes the spaces at both ends before validating the length
export const trim = ({value}: {value: unknown}) => typeof value === 'string' ? value.trim() : value;
