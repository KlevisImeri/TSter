export type TestCase = {
  name: string;
  method: "GET" | "POST" | "PUT" | "DELETE" | "OPTIONS";
  url?: string;
  headers?: Record<string, string>;
  body?: unknown;
  expected: string;
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

export async function TSter(suite: TestSuite) {
  console.log(colors.bold('TSter v1.1'));
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
        const result = await response.text();
        const duration = Date.now() - testStart;

        const statusPassed = testCase.status 
          ? response.status === testCase.status 
          : response.ok;
        const bodyPassed = result.includes(testCase.expected);
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
          failedTests++;
          console.log(colors.red(testLine));
          console.log(`  Method: ${testCase.method}`);
          console.log(`  URL: ${fullUrl}`);
          if (testCase.status) {
            console.log(`  Status: ${colors.strike(`${testCase.status}`)} -> ${colors.red(`${response.status}`)}`);
          } else {
            console.log(`  Status: ${response.status}`);
          }
          console.log(`  Expected: "${testCase.expected}"`);
          console.log("  Response:", JSON.stringify(result, null, 2).replace(/\\"/g, '"').replace(/\\n/g, '\n  ') ?? result);
         }
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
