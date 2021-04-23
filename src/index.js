const express = require("express");
const cors = require("cors");
const AppError = require("./helpers/AppError");
const { v4: uuidv4, validate } = require("uuid");

const app = express();
app.use(express.json());
app.use(cors());

const users = [];

function checksExistsUserAccount(request, response, next) {
  const { username } = request.headers;

  const user = users.find((item) => item.username === username);

  if (!user) {
    return AppError.NotFound(response, "User not found");
  }

  request.user = user;

  next();
}

function checksCreateTodosUserAvailability(request, response, next) {
  const { user } = request;

  if (user.todos.length >= 10 && !user.pro) {
    return AppError.Forbidden(
      response,
      "You step beyond the limit of the free plan, hire the pro plan"
    );
  }

  next();
}

function checksTodoExists(request, response, next) {
  const { id } = request.params;
  const { username } = request.headers;

  const user = users.find((item) => item.username === username);

  if (!user) {
    return AppError.NotFound(response, "User not found");
  }

  const todoExist = user.todos.find((item) => item.id === id);

  if (!validate(id)) {
    return AppError.BadRequest(response, "uuid is not valid");
  }

  if (!todoExist) {
    return AppError.NotFound(response, "todo not found");
  }

  request.user = user;
  request.todo = todoExist;

  next();
}

function findUserById(request, response, next) {
  const { id } = request.params;

  const user = users.find((item) => item.id === id);

  if (!user) {
    return AppError.NotFound(response, "User not found");
  }

  request.user = user;
  next();
}

app.post("/users", (request, response) => {
  const { name, username } = request.body;

  const usernameAlreadyExists = users.some(
    (user) => user.username === username
  );

  if (usernameAlreadyExists) {
    return AppError.BadRequest(response, "Username already exists");
  }

  const user = {
    id: uuidv4(),
    name,
    username,
    pro: false,
    todos: [],
  };

  users.push(user);

  return response.status(201).json(user);
});

app.get("/users/:id", findUserById, (request, response) => {
  const { user } = request;

  return response.json(user);
});

app.patch("/users/:id/pro", findUserById, (request, response) => {
  const { user } = request;

  if (user.pro) {
    return AppError.BadRequest(response, "Pro plan is already activated.");
  }

  user.pro = true;

  return response.json(user);
});

app.get("/todos", checksExistsUserAccount, (request, response) => {
  const { user } = request;

  return response.json(user.todos);
});

app.post(
  "/todos",
  checksExistsUserAccount,
  checksCreateTodosUserAvailability,
  (request, response) => {
    const { title, deadline } = request.body;
    const { user } = request;

    const newTodo = {
      id: uuidv4(),
      title,
      deadline: new Date(deadline),
      done: false,
      created_at: new Date(),
    };

    user.todos.push(newTodo);

    return response.status(201).json(newTodo);
  }
);

app.put("/todos/:id", checksTodoExists, (request, response) => {
  const { title, deadline } = request.body;
  const { todo } = request;

  todo.title = title;
  todo.deadline = new Date(deadline);

  return response.json(todo);
});

app.patch("/todos/:id/done", checksTodoExists, (request, response) => {
  const { todo } = request;

  todo.done = true;

  return response.json(todo);
});

app.delete(
  "/todos/:id",
  checksExistsUserAccount,
  checksTodoExists,
  (request, response) => {
    const { user, todo } = request;

    const todoIndex = user.todos.indexOf(todo);

    if (todoIndex === -1) {
      return AppError.NotFound(response, "Todo not found");
    }

    user.todos.splice(todoIndex, 1);

    return response.status(204).send();
  }
);

module.exports = {
  app,
  users,
  checksExistsUserAccount,
  checksCreateTodosUserAvailability,
  checksTodoExists,
  findUserById,
};
