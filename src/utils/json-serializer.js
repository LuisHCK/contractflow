
function convertBigIntToString(obj) {
	if (Array.isArray(obj)) {
		return obj.map(convertBigIntToString);
	}
	// Preserve Date values as ISO strings instead of empty objects
	if (obj instanceof Date) {
		return obj.toISOString();
	}
	if (obj && typeof obj === 'object') {
		return Object.fromEntries(
			Object.entries(obj).map(([k, v]) => [k, convertBigIntToString(v)])
		);
	}
	if (typeof obj === 'bigint') {
		return obj.toString();
	}
	return obj;
}

const JSONSerializer = (data) => convertBigIntToString(data);

export default JSONSerializer
