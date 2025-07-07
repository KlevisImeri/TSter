import boxen from "boxen";
import chalk from "chalk";

type TestCase = {
  name: string;
  method: "GET" | "POST" | "PUT" | "DELETE" | "OPTIONS";
  url?: string;
  expected: string;
  headers?: Record<string, string>;
  body?: unknown;
};

type TestSet = {
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
  if (url.endsWith('/')) {
    url = url.slice(0, -1);
  }
  if (url && !url.startsWith('/')) {
    url = '/' + url;
  }
  return url;
}

export async function TSter(suite: TestSuite) {
  console.log(boxen(chalk.bold('🚀 TSter v1.0'), {
    padding: 1,
    borderColor: 'blue'
  }));
  console.log(chalk.gray(`📦 Suite: ${suite.name}`));
  console.log(chalk.gray(`🌐 Base URL: ${suite.url}\n`));
  
  let totalTests = 0;
  let failedTests = 0;
  
  for (const testSet of suite.testSets) {
    let suiteUrl = suite.url;
    if (suiteUrl.endsWith('/')) {
      suiteUrl = suiteUrl.slice(0, -1);
    }
    
    let testSetUrl = testSet.url || '';
    testSetUrl = normalizeUrl(testSetUrl);
    
    const baseUrl = suiteUrl + testSetUrl;
   
    console.log(chalk.gray.bold(`\n🧪 ${testSet.name}: ${testSet.url || ''}`));
    console.log(chalk.gray('---------------------------------------'));
    
    for (const testCase of testSet.testCases) {
      totalTests++;
      
      let testCaseUrl = testCase.url || '';
      testCaseUrl = normalizeUrl(testCaseUrl);
      
      const fullUrl = baseUrl + testCaseUrl;
      
      try {
        const response = await fetch(fullUrl, {
          method: testCase.method,
          headers: testCase.headers,
          body: testCase.body ? JSON.stringify(testCase.body) : undefined
        });
        
        const result = await response.text();
        const passed = response.ok && result.includes(testCase.expected);
       
        if (passed) {
          console.log(chalk.green(`  ✓ ${testCase.name}:\t${testCase.url || ''}`));
        } else {
          failedTests++;
          const failureText = [
              `Method: ${testCase.method}`,
              `URL: ${fullUrl}`,
              `Status: ${response.status}`,
              `Expected: "${testCase.expected}"`,
              `Response: ${result.length > 150 ? result.slice(0, 150) + "..." : result}`
          ].join("\n");
          console.log(boxen(failureText, {
            title: `❌ ${testCase.name}`,
            titleAlignment: 'center',
            borderColor: 'red',
            padding: 1
          }));
        }
      } catch (error: unknown) {
        let errorMessage = "An unidentified error occurred!";
        if (error instanceof Error) {
          errorMessage = error.message;
        }
        failedTests++;
        const errorText = [
          `Method: ${testCase.method}`,
          `URL: ${fullUrl}`,
          `Error: ${errorMessage}`
        ].join("\n");
        console.log(boxen(errorText, {
            title: `💥 ${testCase.name}`,
            titleAlignment: 'center',
            borderColor: 'red',
            padding: 1
          }));
      }
    }
  }
  
  const summaryTitle = failedTests > 0
    ? chalk.gray.bold("Some tests failed")
    : chalk.gray.bold("All tests passed");
   
  const summaryText = [
    `Total Tests: ${totalTests}`,
    chalk.green(`Passed: ${totalTests - failedTests}`),
    chalk.red(`Failed: ${failedTests}`)
  ].join("\n");
  
  console.log(boxen(summaryText, {
    title: summaryTitle,
    titleAlignment: 'center',
    margin: {top: 2},
    padding: 1,
    borderStyle: 'double',
    borderColor: failedTests > 0 ? 'red' : 'gray'
  }));
}