import express from "express"
import bodyParser from "body-parser"
import pg from "pg"

const app = express()
const port = 3000

app.use(bodyParser.urlencoded({ extended: true }))
app.use(express.static("public"))
app.set("view engine", "ejs")

const db = new pg.Client({
    user: "postgres",
    host: "localhost",
    database: "todolist",
    password: "postgre987",
    port: 5432,
})
db.connect()
    .then(() => console.log("Connected to the database"))
    .catch(() => console.log("Failed to connect to the database"))

let items = []

async function getData() {
    items = []
    const result = await db.query("SELECT * FROM items ORDER BY id ASC")
    result.rows.forEach((item) => items.push(item))
}

/*

1.create database table and add sample item values.

2.Root route
  -Retrieve data from the table and add it to items array.
  -Send items array to ejs

3.Adding new items
  -Get the new item entered by the user using req.body.
  -Insert that item to the table.
  -Redirect to the root route
  -Rendering error if null value is added

4.Deleting an Item
  -Get the id of the item from body.
  -Delete item int the database table matching with given id 
  -Redirect to the root route

5.Editing or Updating items
  -Get id and title from body
  -Update title in the table with the new title given by the user
   
*/

app.get("/", async (req, res) => {
    try {
        await getData()
        res.render("index.ejs", {
            listTitle: "Today",
            listItems: items,
        })
    } catch (err) {
        console.log(err)
    }
})

app.post("/add", async (req, res) => {
    try {
        const newItem = req.body.newItem
        if (newItem) {
            const result = await db.query("INSERT INTO items(title) VALUES($1) RETURNING title AS added_item", [newItem])
            console.log(`new item ${result.rows[0].added_item} added to the databse`)
            res.redirect("/")
        } else {
            throw new Error("Missing new item")
        }
    } catch (err) {
        if (err.message == "Missing new item") {
            await getData()
            res.render("index", {
                listTitle: "Today",
                listItems: items,
                error: "No item has given",
            })
        }
    }
})

app.post("/edit", async (req, res) => {
    try {
        if (req.body.updatedItemTitle) {
            const updateItemTitle = req.body.updatedItemTitle
            const updateItemId = req.body.updatedItemId
            const result = await db.query("UPDATE items SET title = $1 WHERE id = $2", [updateItemTitle, updateItemId])
            res.redirect("/")
        } else {
            throw new Error("Give some value")
        }
    } catch (err) {
        if (err.message === "Give some value") {
            await getData()
            res.render("index", {
                listTitle: "Today",
                listItems: items,
                error: "Give some value",
            })
        }
    }
})

app.post("/delete", async (req, res) => {
    try {
        if (req.body.deleteItemId) {
            const deleteItemId = req.body.deleteItemId
            const result = await db.query("DELETE FROM items WHERE id = $1 RETURNING *;", [deleteItemId])
            console.log(`item ${result.rows[0].id} has been removed`)
            res.redirect("/")
        } else {
            throw new Error("No id has given")
        }
    } catch (err) {
        console.log(err.message)
    }
})

app.listen(port, () => {
    console.log(`Server running on port ${port}`)
})
