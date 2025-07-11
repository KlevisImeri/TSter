import { TSter, type TestSuite, type TestSet } from "./TSter";

const testPosts: TestSet = {
  name: "Posts Tests",
  url: "/posts",
  testCases: [{
    name: "Get Single Post",
    method: "GET",
    url: "/1",
    expected: "id"
  },{
    name: "Create New Post",
    method: "POST",
    expected: "id",
    headers: { "Content-Type": "application/json" },
    body: { title: "Test Post", body: "Content", userId: 1 }
  }]
};

const testUsers: TestSet = {
  name: "Users Tests",
  url: "/users",
  testCases: [{
    name: "Get User by ID where id is large so it should fail",
    method: "GET",
    url: "/100000",
    expected: "username"
  },{
    name: "Search User",
    method: "GET",
    url: "/?username=Bret",
    expected: "Leanne Graham"
  }]
};


const suite: TestSuite = {
  name: "Example TestSuite",
  url: "https://jsonplaceholder.typicode.com",
  testSets: [testPosts, testUsers]
};

await TSter(suite);
