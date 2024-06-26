const app = require("../app");
const request = require("supertest");
const seed = require("../db/seeds/seed");
const db = require("../db/connection");
const data = require("../db/data/test-data");
const endpoints = require("../endpoints.json");
const jestSorted = require("jest-sorted");

afterAll(() => {
  return db.end();
});
beforeEach(() => {
  return seed(data);
});

describe("/api/topics", () => {
  test("GET 200 - responds with an array of topic objects, each with a description and slug property", () => {
    return request(app)
      .get("/api/topics")
      .expect(200)
      .then(({ body }) => {
        const { topics } = body;
        expect(topics.length).toBe(3);
        topics.forEach((topic) => {
          expect(topics).toBeInstanceOf(Array);
          expect(topic).toMatchObject({
            description: expect.any(String),
            slug: expect.any(String),
          });
        });
      });
  });
});

describe("404 Errors", () => {
  test("GET 404 - responds with 'Not Found'", () => {
    return request(app)
      .get("/api/invalid-route")
      .expect(404)
      .then(({ body }) => {
        expect(body).toEqual({ msg: "Not Found" });
      });
  });
});

describe("/api", () => {
  test("GET 200 - responds with an object describing all available endpoints", () => {
    return request(app)
      .get("/api")
      .then((response) => {
        expect(response.status).toBe(200);
        expect(response.body).toEqual(endpoints);
      });
  });
});

describe("/api/articles/:article_id", () => {
  test("GET 200 - responds with an article object", () => {
    return request(app)
      .get("/api/articles/1")
      .expect(200)
      .then(({ body }) => {
        const { article } = body;
        expect(article).toMatchObject({
          author: expect.any(String),
          title: expect.any(String),
          article_id: expect.any(Number),
          body: expect.any(String),
          topic: expect.any(String),
          created_at: expect.any(String),
          votes: expect.any(Number),
          article_img_url: expect.any(String),
        });
      });
  });
  test("GET 200 - responds with an article object including comment_count", () => {
    return request(app)
      .get("/api/articles/1")
      .expect(200)
      .then(({ body }) => {
        const { article } = body;
        expect(article).toMatchObject({
          author: expect.any(String),
          title: expect.any(String),
          article_id: expect.any(Number),
          body: expect.any(String),
          topic: expect.any(String),
          created_at: expect.any(String),
          votes: expect.any(Number),
          article_img_url: expect.any(String),
          comment_count: expect.any(Number),
        });
        expect(article).toEqual({
          author: "butter_bridge",
          title: "Living in the shadow of a great man",
          article_id: 1,
          body: "I find this existence challenging",
          topic: "mitch",
          created_at: "2020-07-09T20:11:00.000Z",
          votes: 100,
          article_img_url:
            "https://images.pexels.com/photos/158651/news-newsletter-newspaper-information-158651.jpeg?w=700&h=700",
          comment_count: 11,
        });
      });
  });

  test("GET 404 - responds with 'Not Found' for a non-existent article ID", () => {
    return request(app)
      .get("/api/articles/9999")
      .expect(404)
      .then(({ body }) => {
        expect(body).toEqual({ msg: "Not Found" });
      });
  });

  test("GET 400 - responds with 'Bad Request' for an invalid article ID", () => {
    return request(app)
      .get("/api/articles/not-a-number")
      .expect(400)
      .then(({ body }) => {
        expect(body).toEqual({ msg: "Bad Request" });
      });
  });
});

describe("/api/articles", () => {
  test("GET 200 - responds with an array of all articles when no topic query is provided", () => {
    return request(app)
      .get("/api/articles")
      .expect(200)
      .then(({ body }) => {
        const { articles } = body;
        expect(articles.length).toBeGreaterThan(0);
        articles.forEach((article) => {
          expect(article).toMatchObject({
            author: expect.any(String),
            title: expect.any(String),
            article_id: expect.any(Number),
            topic: expect.any(String),
            created_at: expect.any(String),
            votes: expect.any(Number),
            article_img_url: expect.any(String),
            comment_count: expect.any(Number),
          });
        });
      });
  });

  test("GET 200 - responds with an empty array when the topic exists but there are no articles for that topic", () => {
    return request(app)
      .get("/api/articles?topic=paper")
      .expect(200)
      .then(({ body }) => {
        const { articles } = body;
        expect(articles).toBeInstanceOf(Array);
        expect(articles.length).toBe(0);
      });
  });

  test("GET 200 - responds with an array of articles filtered by the topic query", () => {
    return request(app)
      .get("/api/articles?topic=mitch")
      .expect(200)
      .then(({ body }) => {
        const { articles } = body;
        expect(articles.length).toBeGreaterThan(0);
        articles.forEach((article) => {
          expect(article.topic).toBe("mitch");
        });
      });
  });

  test("GET 200 - responds with articles sorted by title in ascending order", () => {
    return request(app)
      .get("/api/articles?sort_by=title&order=asc")
      .expect(200)
      .then(({ body }) => {
        const { articles } = body;
        expect(articles).toBeSortedBy("title", { ascending: true });
      });
  });

  test("GET 200 - responds with articles sorted by votes in descending order", () => {
    return request(app)
      .get("/api/articles?sort_by=votes&order=desc")
      .expect(200)
      .then(({ body }) => {
        const { articles } = body;
        expect(articles).toBeSortedBy("votes", { descending: true });
      });
  });

  test("GET 400 - responds with 'Bad Request' for invalid sort_by column", () => {
    return request(app)
      .get("/api/articles?sort_by=invalid_column")
      .expect(400)
      .then(({ body }) => {
        expect(body.msg).toBe("Bad Request: Invalid sort_by column");
      });
  });

  test("GET 400 - responds with 'Bad Request' for invalid order value", () => {
    return request(app)
      .get("/api/articles?order=invalid_order")
      .expect(400)
      .then(({ body }) => {
        expect(body.msg).toBe("Bad Request: Invalid order value");
      });
  });

  test("GET 404 - responds with an error if the topic does not exist", () => {
    return request(app)
      .get("/api/articles?topic=not-a-topic")
      .expect(404)
      .then(({ body }) => {
        expect(body.msg).toBe("Not Found");
      });
  });
});
describe("GET /api/articles/:article_id/comments", () => {
  test("200: responds with an array of comments for the given article_id", () => {
    return request(app)
      .get("/api/articles/1/comments")
      .expect(200)
      .then(({ body }) => {
        expect(body.comments).toBeInstanceOf(Array);
        expect(body.comments.length).toBeGreaterThan(0);
        body.comments.forEach((comment) => {
          expect(comment).toEqual(
            expect.objectContaining({
              comment_id: expect.any(Number),
              votes: expect.any(Number),
              created_at: expect.any(String),
              author: expect.any(String),
              body: expect.any(String),
              article_id: 1,
            })
          );
        });
      });
  });

  test("200: responds with an empty array when the article has no comments", () => {
    return request(app)
      .get("/api/articles/2/comments")
      .expect(200)
      .then(({ body }) => {
        expect(body.comments).toEqual([]);
      });
  });

  test("responds with comments sorted by date in descending order", () => {
    return request(app)
      .get("/api/articles/1/comments")
      .expect(200)
      .then(({ body }) => {
        const { comments } = body;
        expect(comments).toBeSortedBy("created_at", {
          descending: true,
          date: true,
        });
      });
  });

  test("400: responds with 'Bad Request' when article_id is invalid", () => {
    return request(app)
      .get("/api/articles/not-a-number/comments")
      .expect(400)
      .then(({ body }) => {
        expect(body.msg).toBe("Bad Request");
      });
  });

  test("404: responds with 'Not Found' when article_id does not exist", () => {
    return request(app)
      .get("/api/articles/9999/comments")
      .expect(404)
      .then(({ body }) => {
        expect(body.msg).toBe("Not Found");
      });
  });
});

describe("POST /api/articles/:article_id/comments", () => {
  test("201: responds with the posted comment", () => {
    const newComment = {
      username: "butter_bridge",
      body: "This is a great article!",
    };
    return request(app)
      .post("/api/articles/1/comments")
      .send(newComment)
      .expect(201)
      .then(({ body }) => {
        expect(body.comment).toEqual(
          expect.objectContaining({
            comment_id: expect.any(Number),
            votes: 0,
            created_at: expect.any(String),
            author: "butter_bridge",
            body: "This is a great article!",
            article_id: 1,
          })
        );
      });
  });

  test("400: responds with 'Bad Request' when article_id is invalid", () => {
    const newComment = {
      username: "butter_bridge",
      body: "This is a great article!",
    };
    return request(app)
      .post("/api/articles/not-a-number/comments")
      .send(newComment)
      .expect(400)
      .then(({ body }) => {
        expect(body.msg).toBe("Bad Request");
      });
  });

  test("404: responds with 'Not Found' when article_id does not exist", () => {
    const newComment = {
      username: "butter_bridge",
      body: "This is a great article!",
    };
    return request(app)
      .post("/api/articles/9999/comments")
      .send(newComment)
      .expect(404)
      .then(({ body }) => {
        expect(body.msg).toBe("Not Found");
      });
  });

  test("400: responds with 'Bad Request' when username is missing", () => {
    const newComment = {
      body: "This is a great article!",
    };
    return request(app)
      .post("/api/articles/1/comments")
      .send(newComment)
      .expect(400)
      .then(({ body }) => {
        expect(body.msg).toBe("Bad Request");
      });
  });

  test("400: responds with 'Bad Request' when body is missing", () => {
    const newComment = {
      username: "butter_bridge",
    };
    return request(app)
      .post("/api/articles/1/comments")
      .send(newComment)
      .expect(400)
      .then(({ body }) => {
        expect(body.msg).toBe("Bad Request");
      });
  });

  test("404: responds with 'Not Found' when username does not exist", () => {
    const newComment = {
      username: "nonexistent_user",
      body: "This is a great article!",
    };
    return request(app)
      .post("/api/articles/1/comments")
      .send(newComment)
      .expect(404)
      .then(({ body }) => {
        expect(body.msg).toBe("Not Found");
      });
  });
});

describe("PATCH /api/articles/:article_id", () => {
  test("200: responds with the updated article with an increased number of votes", () => {
    return request(app)
      .patch("/api/articles/1")
      .send({ newVotes: 1 })
      .expect(200)
      .then(({ body }) => {
        const { article } = body;
        expect(article).toEqual(
          expect.objectContaining({
            article_id: 1,
            votes: 101,
          })
        );
      });
  });

  test("200: responds with the updated article with a decreased number of votes", () => {
    return request(app)
      .patch("/api/articles/1")
      .send({ newVotes: -1 })
      .expect(200)
      .then(({ body }) => {
        const { article } = body;
        expect(article).toEqual(
          expect.objectContaining({
            article_id: 1,
            votes: 99,
          })
        );
      });
  });

  test("400: responds with 'Bad Request' when newVotes is not a number", () => {
    return request(app)
      .patch("/api/articles/1")
      .send({ newVotes: "not-a-number" })
      .expect(400)
      .then(({ body }) => {
        expect(body.msg).toBe("Bad Request");
      });
  });

  test("404: responds with 'Not Found' for a non-existent article ID", () => {
    return request(app)
      .patch("/api/articles/9999")
      .send({ newVotes: 1 })
      .expect(404)
      .then(({ body }) => {
        expect(body.msg).toBe("Not Found");
      });
  });

  test("400: responds with 'Bad Request' for an invalid article ID", () => {
    return request(app)
      .patch("/api/articles/not-a-number")
      .send({ newVotes: 1 })
      .expect(400)
      .then(({ body }) => {
        expect(body.msg).toBe("Bad Request");
      });
  });
});

describe("DELETE /api/comments/:comment_id", () => {
  test("204: successfully deletes the comment by comment_id", () => {
    return request(app)
      .delete("/api/comments/1")
      .expect(204)
      .then(() => {
        return db.query("SELECT * FROM comments WHERE comment_id = 1");
      })
      .then((result) => {
        expect(result.rows.length).toBe(0);
      });
  });

  test("404: responds with 'Not Found' for a non-existent comment ID", () => {
    return request(app)
      .delete("/api/comments/9999")
      .expect(404)
      .then(({ body }) => {
        expect(body.msg).toBe("Not Found");
      });
  });

  test("400: responds with 'Bad Request' for an invalid comment ID", () => {
    return request(app)
      .delete("/api/comments/not-a-number")
      .expect(400)
      .then(({ body }) => {
        expect(body.msg).toBe("Bad Request");
      });
  });
});

describe("/api/users", () => {
  test("GET 200 - responds with an array of user objects, each with a username, name, and avatar_url property", () => {
    return request(app)
      .get("/api/users")
      .expect(200)
      .then(({ body }) => {
        const { users } = body;
        expect(users.length).toBeGreaterThan(0);
        users.forEach((user) => {
          expect(user).toMatchObject({
            username: expect.any(String),
            name: expect.any(String),
            avatar_url: expect.any(String),
          });
        });
      });
  });
});
