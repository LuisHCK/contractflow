
function convertBigIntToString(obj) {
	if (Array.isArray(obj)) {
		return obj.map(convertBigIntToString);
	} else if (obj && typeof obj === 'object') {
		return Object.fromEntries(
			Object.entries(obj).map(([k, v]) => [k, convertBigIntToString(v)])
		);
	} else if (typeof obj === 'bigint') {
		return obj.toString();
	}
	return obj;
}

const JSONSerializer = (data) => convertBigIntToString(data);

export default JSONSerializer
