import { TSter, type TestSuite } from "./TSter";


const suite: TestSuite = {
  name: "Example TestSuite",
  url: "https://jsonplaceholder.typicode.com",
  testSets: [
    {
      name: "Posts Tests",
      url: "/posts",
      testCases: [
        {
          name: "Get Single Post",
          method: "GET",
          url: "/1",
          expected: "id"
        },
        {
          name: "Create New Post",
          method: "POST",
          expected: "id",
          headers: { "Content-Type": "application/json" },
          body: { title: "Test Post", body: "Content", userId: 1 }
        }
      ]
    },
    {
      name: "Users Tests",
      url: "/users",
      testCases: [
        {
          name: "Get User by ID",
          method: "GET",
          url: "/100000",
          expected: "username"
        },
        {
          name: "Search Users",
          method: "GET",
          url: "/?username=Bret",
          expected: "Leanne Graham"
        }
      ]
    }
  ],
};

await TSter(suite);
