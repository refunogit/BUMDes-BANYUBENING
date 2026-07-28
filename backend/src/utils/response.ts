export function successResponse(data: any, message = 'Success', meta?: any) {
  return {
    success: true,
    message,
    data,
    ...(meta ? { meta } : {}),
  };
}

export function errorResponse(message = 'Error', errors?: any) {
  return {
    success: false,
    message,
    ...(errors ? { errors } : {}),
  };
}
