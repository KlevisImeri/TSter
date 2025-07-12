export type TestCase = {
  name: string;
  method: "GET" | "POST" | "PUT" | "DELETE" | "OPTIONS";
  url?: string;
  headers?: Record<string, string>;
  body?: unknown;
  expected: JsonValue;
  status?: number;
};

export type TestSet = {
  name: string;
  url?: string;
  testCases: TestCase[];
};

export type TestSuite = {
  name: string;
  url: string;
  testSets: TestSet[];
};

type JsonPrimitive = string | number | boolean | null;
type JsonObject = { [key: string]: JsonValue; };
type JsonArray = JsonValue[];
export type JsonValue = JsonPrimitive | JsonObject | JsonArray;

function normalizeUrl(url: string): string {
  if (url.endsWith('/')) url = url.slice(0, -1);
  if (url && !url.startsWith('/')) url = '/' + url;
  return url;
}

const colors = {
  green: (text: string) => `\x1b[32m${text}\x1b[0m`,
  red: (text: string) => `\x1b[31m${text}\x1b[0m`,
  bold: (text: string) => `\x1b[1m${text}\x1b[0m`,
  strike: (text: string) => `\x1b[9m${text}\x1b[0m`,
};

function matchJson(pattern: JsonValue, target: JsonValue): boolean {
  if (typeof pattern !== 'object' || pattern === null) return pattern === target;
  if (typeof target !== 'object' || target === null) return false;
  if (Array.isArray(pattern)) {
    if (!Array.isArray(target) || pattern.length !== target.length) return false;
    return pattern.every((elem, index) => matchJson(elem, target[index]!));
  }
  if (Array.isArray(target)) return false;
  const patternKeys = Object.keys(pattern);
  for (const key of patternKeys) {
    if (!target.hasOwnProperty(key) ||
        !matchJson(pattern[key]!, target[key]!)) return false;
  }
  return true;
}

export async function TSter(suite: TestSuite) {
  console.log(colors.bold('TSter v1.2'));
  console.log(`Suite: ${suite.name}`);
  console.log(`Base URL: ${suite.url}\n`);
  
  let totalTests = 0;
  let failedTests = 0;
  
  for (const testSet of suite.testSets) {
    const normalizeSuiteUrl = suite.url.endsWith('/') ? suite.url.slice(0, -1) : suite.url;
    const baseUrl = normalizeSuiteUrl + normalizeUrl(testSet.url || '');
    
    console.log(colors.bold(`\n[${testSet.name}: ${testSet.url || ''}]`));
    
    for (const testCase of testSet.testCases) {
      totalTests++;
      const fullUrl = baseUrl + normalizeUrl(testCase.url || '');
      
      try {
        const testStart = Date.now();
        const response = await fetch(fullUrl, {
          method: testCase.method,
          headers: testCase.headers,
          body: testCase.body ? JSON.stringify(testCase.body) : undefined
        }); 
        const duration = Date.now() - testStart;

        const itsStr = typeof testCase.expected === 'string';
        let body: JsonValue = await (itsStr ? response.text(): response.json()) as JsonValue;

        const statusPassed = testCase.status 
          ? response.status === testCase.status 
          : response.ok;
        const bodyPassed = itsStr 
          ? (body as string).includes(testCase.expected as string)
          : matchJson(testCase.expected, body);
        const passed = statusPassed && bodyPassed; 

        const nameColumnWidth = 30;
        const displayName = testCase.name.length > nameColumnWidth
          ? testCase.name.substring(0, nameColumnWidth - 3) + '...'
          : testCase.name;

        const testLine = [
          `  [${passed ? '✓' : '✗'}]`,
          displayName.padEnd(nameColumnWidth),
          ' | ',
          testCase.method.padEnd(0),
          (testCase.url || '').padEnd(0),
          `[${duration.toString().padStart(0)}ms]`
        ].join(' ');
        if (passed) {
          console.log(colors.green(testLine));
        } else {
          console.log(colors.red(testLine));
          console.log(`  Method: ${testCase.method}`);
          console.log(`  URL: ${fullUrl}`);
          if (testCase.status && testCase.status != response.status) {
              console.log(`  Status: ${colors.strike(`${testCase.status}`)} -> ${colors.red(`${response.status}`)}`);
          }
          else {
              console.log(`  Status: ${response.status}`);
          }
          console.log(`  Expected: ${(JSON.stringify(testCase.expected, null, 2) || "").replace(/^/gm, '  ').slice(2)}`);
          console.log(`  Response: ${(JSON.stringify( itsStr ? JSON.parse(body) : body, null, 2) || "").replace(/^/gm,'  ').slice(2)}`);
        }
        failedTests++;
      } catch (error: unknown) {
        failedTests++;
        const errorMessage = error instanceof Error ? error.message : "An unidentified error occurred!";
        console.log(colors.red(`  [ERROR] ${errorMessage}`));
      }
    }
  }

  console.log(`\nTotal Tests: ${totalTests}`);
  console.log(colors.green(`Passed: ${totalTests - failedTests}`));
  console.log(colors.red(`Failed: ${failedTests}`));
}
