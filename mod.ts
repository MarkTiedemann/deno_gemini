const encoder = new TextEncoder();
const decoder = new TextDecoder();

export const ERRORS = {
	INVALID_PROTOCOL: (protocol: string) => `Invalid protocol (expected "gemini:", got "${protocol}")`,
	NO_STATUS: "No status",
	NON_NUMERIC_STATUS: (status: string) => `Non-numeric status (expected number, got "${status}")`,
	INVALID_STATUS_RANGE: (status: number) => `Invalid status range (expected >9 and <70, got ${status})`,
	NO_SPACE: "No space",
	INVALID_SPACE: (space: number) => `Invalid space (expected 0x20, got 0x${space.toString(16)})`,
	NO_META: "No meta",
	MAX_META_LENGTH_EXCEEDED: `Maximum meta length exceeded (expected to find \\r\\n within 1024 characters)`,
};

export async function fetch(url: string) {
	let uri = new URL(url);
	if (uri.protocol !== "gemini:") throw new RangeError(ERRORS.INVALID_PROTOCOL(uri.protocol));
	let port = uri.port === "" ? 1965 : parseInt(uri.port);
	let conn = await Deno.connectTls({ hostname: uri.hostname, port });
	try {
		await conn.write(encoder.encode(`${uri.href}\r\n`));
		return await Deno.readAll(conn);
	} finally {
		conn.close();
	}
}

export function parse(buf: Uint8Array) {
	let len = buf.length;
	if (len < 2) throw new RangeError(ERRORS.NO_STATUS);
	let status_string = decoder.decode(buf.subarray(0, 2));
	let status = parseInt(status_string);
	if (isNaN(status)) throw new RangeError(ERRORS.NON_NUMERIC_STATUS(status_string));
	if (status < 10 || status > 69) throw new RangeError(ERRORS.INVALID_STATUS_RANGE(status));
	if (len < 3) throw new RangeError(ERRORS.NO_SPACE);
	if (buf[2] !== 0x20) throw new RangeError(ERRORS.INVALID_SPACE(buf[2]));
	if (len < 5) throw new RangeError(ERRORS.NO_META);
	let i_crlf = -1;
	for (let i = 3; i < 3 + 1024 + 1; i++) {
		if (buf[i] === 13 /*\r*/ && buf[i + 1] === 10 /*\n*/) {
			i_crlf = i;
			break;
		}
	}
	if (i_crlf === -1) throw new RangeError(ERRORS.MAX_META_LENGTH_EXCEEDED);
	let meta = decoder.decode(buf.subarray(3, i_crlf));
	let body = buf.subarray(i_crlf + 2);
	return { status, meta, body };
}
