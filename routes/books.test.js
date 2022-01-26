process.env.NODE_ENV = 'test'

const request = require('supertest')
const app = require('../app')
const db = require('../db')

let testBook;

beforeEach(async function() {
    const results = await db.query(`
        INSERT INTO books (
            isbn, amazon_url, author,
            language, pages, publisher,
            title, year
        VALUES (
            testbook, www.google.com, test author,
            english, 100, testpublisher, testbook, 2022
        )
        RETURNING isbn, amazon_url, author,
        language, pages, publisher,
        title, year
    )`)
    testBook = results.rows[0]
})

afterEach(async function() {
    await db.query('DELETE FROM books')
})

afterAll(async function() {
    await db.end()
})

describe('GET /books', function() {
    test('Gets a list of 1 book', async function() {
        const response = await request(app).get('/books')
        expect(response.statusCode).toEqual(200)
        expect(response.body).toEqual([testBook])
    })
})

describe('GET /books/:id', function() {
    test('Get book by id', async function() {
        const response = await request(app).get(`/books/${testBook.isbn}`)
        expect(response.statusCode).toEqual(200)
        expect(response.body).toEqual(testBook)
    })

    test('Responds with 404 if cannot find book', async function() {
        const response = await request(app).get(`/books/0`)
        expect(response.statusCode).toEqual(404)
    })
})

describe('POST /books', function() {
    test('Create a book', async function() {
        const body = {
            isbn: "test2",
            amazon_url: "www.test.com",
            author: "author",
            language: "polish",
            pages: 200,
            publisher: "publisher",
            title: "Testing test",
            year: 2023
        }

        const response = await request(app)
            .post(`/books`)
            .send(body)
        expect(response.statusCode).toEqual(201)
        expect(response.body).toEqual(body)
    })

    test('Responds with 400 if invalid data', async function() {
        const response = await request(app)
            .post(`/books`)
            .send({isbn: "test2"})
        expect(response.statusCode).toEqual(400)
    })
})

describe('PUT /books/:isbn', function() {
    test('Update a book by isbn', async function() {
        const body = {
            amazon_url: "www.test.com",
            author: "author",
            language: "polish",
            pages: 200,
            publisher: "publisher",
            title: "Testing test",
            year: 2023
        }

        const response = await request(app)
            .post(`/books/${testBook}`)
            .send(body)
        expect(response.statusCode).toEqual(201)
        expect(response.body).toEqual({
            isbn: "testbook",
            amazon_url: "www.test.com",
            author: "author",
            language: "polish",
            pages: 200,
            publisher: "publisher",
            title: "Testing test",
            year: 2023
        })
    })

    test('Responds with 400 if invalid data', async function() {
        const response = await request(app)
            .post(`/books/${testBook}`)
            .send({isbn: "test2"})
        expect(response.statusCode).toEqual(400)
    })
})

describe('DELETE /books/:id', function() {
    test('Delete book by id', async function() {
        const response = await request(app).delete(`/books/${testBook.isbn}`)
        expect(response.statusCode).toEqual(200)
        expect(response.body).toEqual({ message: "Book deleted" })
    })

    test('Responds with 404 if cannot find book', async function() {
        const response = await request(app).get(`/books/0`)
        expect(response.statusCode).toEqual(404)
    })
})