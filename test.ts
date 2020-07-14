import { fetch, parse, ERRORS } from "./mod.ts";
import { assertStrictEquals, assertThrows, assertThrowsAsync } from "https://deno.land/std@0.61.0/testing/asserts.ts";

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function test_parse_throws(header: string, message: string) {
	Deno.test(message, () => {
		assertThrows(() => parse(encoder.encode(header)), RangeError, message);
	});
}

test_parse_throws("", ERRORS.NO_STATUS);
test_parse_throws("ab", ERRORS.NON_NUMERIC_STATUS("ab"));
test_parse_throws("09", ERRORS.INVALID_STATUS_RANGE(9));
test_parse_throws("70", ERRORS.INVALID_STATUS_RANGE(70));
test_parse_throws("20", ERRORS.NO_SPACE);
test_parse_throws("20!", ERRORS.INVALID_SPACE(33));
test_parse_throws("20 " + "m".repeat(1024 + 1) + "\r\n", ERRORS.MAX_META_LENGTH_EXCEEDED);

Deno.test(`parse("20 <meta><crlf>")`, () => {
	let expected_status = 20;
	let expected_meta = "m".repeat(1024);
	let expected_body = new Uint8Array();
	let header = parse(encoder.encode(expected_status + " " + expected_meta + "\r\n"));
	assertStrictEquals(expected_status, header.status);
	assertStrictEquals(expected_meta, header.meta);
	assertStrictEquals(expected_body.length, 0);
});

Deno.test(`parse("20 <meta><crlf><body>")`, () => {
	let expected_status = 20;
	let expected_meta = "text/gemini";
	let expected_body = "Hello, space!";
	let header = parse(encoder.encode(expected_status + " " + expected_meta + "\r\n" + expected_body));
	assertStrictEquals(expected_status, header.status);
	assertStrictEquals(expected_meta, header.meta);
	assertStrictEquals(expected_body, decoder.decode(header.body));
});

Deno.test(ERRORS.INVALID_PROTOCOL("proto:"), () => {
	assertThrowsAsync(async () => await fetch("proto://"), RangeError, ERRORS.INVALID_PROTOCOL("proto:"));
});

Deno.test(`fetch("gemini://gemini.circumlunar.space/")`, async () => {
	let buf = await fetch("gemini://gemini.circumlunar.space/");
	let { status, meta, body } = parse(buf);
	assertStrictEquals(status, 20);
	assertStrictEquals(meta, "text/gemini");
	assertStrictEquals(body.length > 0, true);
});
