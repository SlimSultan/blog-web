import express from "express";
import fs from "fs";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import methodOverride from "method-override";
import { v4 as uuidv4 } from "uuid";

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));

//JSON file storage
const DATA_FILE = path.join(__dirname, "data", "posts.json");

//Data directory file
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, "[]", "utf8");
}

// Read posts safely
function readPosts() {
  try {
    const data = fs.readFileSync(DATA_FILE, "utf8");
    return JSON.parse(data);
  } catch (err) {
    console.error("Error reading posts:", err);
    return [];
  }
}

//Write posts safely
function writePosts(posts) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(posts, null, 2), "utf8");
}

const CATEGORIES = [
  "Home",
  "Essays",
  "H&P",
  "Books",
  "YC",
  "Arc",
  "Bel",
  "Lisp",
  "Spam",
  "Responses",
  "FAQS",
  "RAQS",
  "Quotes",
  "R55",
  "Bio",
  "Twitter",
  "Mastodon",
];

//Home-list recent posts
app.get("/", (req, res) => {
  const posts = readPosts().sort(
    (a, b) =>
      new Date(b.updatedAt || b.createdAt) -
      new Date(a.updatedAt || a.createdAt)
  );
  res.render("index", { posts, categories: CATEGORIES });
});

//category page
app.get("/category/:name", (req, res) => {
  const name = req.params.name;
  const posts = readPosts().filter((p) => p.category === name);
  res.render("category", { posts, category: name, categories: CATEGORIES });
});

//New post form
app.get("/posts/new", (req, res) => {
  res.render("new", { categories: CATEGORIES });
});

//Create post
app.post("/posts", (req, res) => {
  const { title, body, category, author } = req.body;
  const posts = readPosts();
  const newPost = {
    id: uuidv4(),
    title: title || "Untitled",
    body: body || "",
    category: category || "Home",
    author: author || "Anonymous",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  posts.push(newPost);
  writePosts(posts);
  res.redirect(`/posts/${newPost.id}`);
});

//Show single post
app.get("/posts/:id", (req, res) => {
  const posts = readPosts();
  const post = posts.find((p) => p.id === req.params.id);
  if (!post) return res.status(404).send("Post not found");
  res.render("show", { post, categories: CATEGORIES });
});

//Edit form
app.get("/posts/:id/edit", (req, res) => {
  const posts = readPosts();
  const post = posts.find((p) => p.id === req.params.id);
  if (!post) return res.status(404).send("Post not found");
  res.render("edit", { post, categories: CATEGORIES });
});

//Update
app.put("/posts/:id", (req, res) => {
  const posts = readPosts();
  const idx = posts.findIndex((p) => p.id === req.params.id);
  if (idx === -1) return res.status(404).send("Post not found");

  posts[idx] = {
    ...posts[idx],
    title: req.body.title || posts[idx].title,
    body: req.body.body || posts[idx].body,
    category: req.body.category || posts[idx].category,
    author: req.body.author || posts[idx].author,
    updatedAt: new Date().toISOString(),
  };

  writePosts(posts);
  res.redirect(`/posts/${posts[idx].id}`);
});

//Delete
app.delete("/posts/:id", (req, res) => {
  let posts = readPosts();
  posts = posts.filter((p) => p.id !== req.params.id);
  writePosts(posts);
  res.redirect("/");
});

//Search (by title)
app.get("/search", (req, res) => {
  const q = (req.query.q || "").toLowerCase();
  const posts = readPosts().filter(
    (p) => p.title.toLowerCase().includes(q) || p.body.toLowerCase().includes(q)
  );
  res.render("index", { posts, categories: CATEGORIES, search: q });
});

 app.use((err, req, res, next) => {
   console.error(err.stack);
   res.status(500).send("something broke");
 });
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
