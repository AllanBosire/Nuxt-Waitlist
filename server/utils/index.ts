export function tryParse<T extends object>(str: any): T {
	// @ts-expect-error
	const { error, result } = execute(function () {
		return JSON.parse(str) as T;
	});

	if (error) {
		console.error(error);
		return str;
	}

	return result as T;
}
