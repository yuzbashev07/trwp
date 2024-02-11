import { Router } from "express";
import path, { resolve } from 'path';
import mysql from 'mysql';
import { read } from "fs";

export const rootRouter = Router();
const __dirname = path.resolve();

/* ==================================================*/
/* DB CONNECTION */

const connection = mysql.createConnection({
    multipleStatements: true,
    host: 'localhost',
    user: 'root',
    password: '03795',
    database: 'trwp'
});

connection.connect(function (err) {
    if (err) throw err;
    console.log("DB connected!");
});

/* ==================================================*/
/* PATHS CONFIGURATION */

/* ROOT PATH */
rootRouter.get('/', (req, res) => {
    res.render(__dirname + "/static/html/root.ejs");
});

/* GET USERS */
rootRouter.get('/users', (req, res) => {
    connection.query('SELECT * FROM readers', (err, readers) => {
        if (err) throw err
        console.log(readers);
        res.render(__dirname + "/static/html/userList.ejs", { readers: readers });
    });
});

/* GET PAGE CREATE USER */
rootRouter.get('/users/add', (req, res) => {
    const sql = `SELECT * FROM books`;
    connection.query(sql, (err, books) => {
        if (err) throw err
        console.log(books);
        res.render(__dirname + "/static/html/addUser.ejs", { books: books });
    });
});

function idFromName(name) {
    return new Promise((resolve) => {
        connection.query(`SELECT readersId FROM readers WHERE readersName = ${name}`, (err, readersId) => {
            readersId = JSON.stringify(readersId[0].readersId);
            console.log(`ReadersID from async table: ${readersId}`);
            resolve(readersId);
        });
    });
};

/* CREATE USER */
rootRouter.post('/users/add', (req, res) => {
    const readersName = String('"' + req.body.fio + '"');
    let books = req.body.books;
    books = String(books);
    books = books.split(',');

    for (let index = 0; index < books.length; index++) {
        connection.query(`SELECT count(*) as howManyTaken, booksCount, booksName FROM takenBooksList JOIN books ON books.booksId = takenBooksList.bookId WHERE booksId = '${books[index]}'`, (err, result) => {
            console.log(`Type of howManyTaken: ${typeof (result[index]?.howManyTaken)}`);
            if ((typeof result[index]?.howManyTaken) === "undefined") {
                ;
            } else {
                if (result[index].howManyTaken === result[index].booksCount) {
                    res.send(`Нельзя взять книгу ${result[index].booksName}`);
                };
            };

        });
    };

    const sql1 = `INSERT INTO readers (readersName) VALUES (${readersName})`;
    connection.query(sql1, (err) => {
        if (err) throw err
    });

    const id = idFromName(readersName).then((value) => {
        console.log(`VALUE: ${value}`);

        for (let index = 0; index < books.length; index++) {
            connection.query(`INSERT INTO takenBooksList (readesId, bookId) VALUES (${value} ,${books[index]})`, (error) => {
                if (error) throw error
            });
        };
        res.redirect('/users');
    });
});

/* GET LIST OF BOOKS TAKEN BY USER */
rootRouter.get('/users/:id', (req, res) => {
    const id = req.params.id;
    connection.query(`SELECT readers.readersId, readers.readersName, books.booksId, books.booksName FROM readers INNER JOIN takenBooksList ON readersId = readersId INNER JOIN books ON takenBooksList.bookId = books.booksId WHERE readers.readersId = ${id} AND takenBooksList.readesId = ${id}`, (err, books) => {
        if (err) throw err
        console.log(books);
        res.render(__dirname + "/static/html/booksTakenByUser.ejs", { books: books });
    });
});

/* DELETE USER */
rootRouter.post("/users/delete/:id", (req, res) => {
    const id = req.params.id;
    console.log(id);
    const sql = ``;
    connection.query(`DELETE FROM readers WHERE readersId = ${id}; DELETE FROM takenBooksList WHERE readesId = ${id}`, (err) => {
        if (err) throw err
        res.redirect('/users');
    });
});

/* GET BOOKS */
rootRouter.get('/books', (req, res) => {
    connection.query('SELECT * FROM books', (err, books) => {
        if (err) throw err
        console.log(books);
        res.render(__dirname + "/static/html/bookList.ejs", { books: books });
    });
});

/* GET PAGE ADD BOOK */
rootRouter.get('/books/add/', (req, res) => {
    res.render(__dirname + '/static/html/addBook.ejs');
});

/* ADD BOOK */
rootRouter.post('/books/add', (req, res) => {
    console.log(req.body)
    const bookName = String('"' + req.body.bookName + '"');
    const bookAuthor = String('"' + req.body.bookAuthor + '"');
    const bookCount = Number(req.body.bookCount);
    connection.query(`INSERT INTO books (booksName, booksAuthor, booksCount) VALUES (${bookName}, ${bookAuthor}, ${bookCount})`, (err) => {
        if (err) throw err;
        res.redirect('/books');
    })
});

/* RENDER EDIT BOOK PAGE */
rootRouter.get('/books/:id/edit', (req, res) => {
    const id = req.params.id;
    connection.query(`SELECT * FROM books WHERE booksId = ${id}`, (err, editBook) => {
        if (err) throw err;
        res.render(__dirname + '/static/html/addBook.ejs', { editBook: editBook });
    })
});


/* EDIT BOOK DATA */
rootRouter.post('/books/:id/edit', (req, res) => {
    const bookId = req.params.id;
    const bookName = String('"' + req.body.bookName + '"');
    const bookAuthor = String('"' + req.body.bookAuthor + '"');
    const bookCount = Number(req.body.bookCount);
    connection.query(`UPDATE books SET booksName = ${bookName}, booksAuthor = ${bookAuthor}, booksCount = ${bookCount} WHERE booksId = ${bookId}`, (err) => {
        if (err) throw err;
        res.redirect('/books');
    });
});

/* DELETE BOOKS */
rootRouter.post("/books/delete/:id", (req, res) => {
    const id = req.params.id;
    console.log(id);
    const sql = ``;
    connection.query(`DELETE FROM books WHERE booksId = ${id}; DELETE FROM takenBooksList WHERE bookId = ${id}`, (err) => {
        if (err) throw err
        res.redirect('/books');
    });
});