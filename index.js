const express = require('express')
const mysql = require('mysql')
const bodyParser = require('body-parser')
const jwt = require('jsonwebtoken')

const app = express()

const secretKey = 'thisisverysecretkey'

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({
  extended: true
}))

const db = mysql.createConnection({
  host: '127.0.0.1',
  port: '3306',
  user: 'root',
  password: '',
  database: "jual_desinfektan"
})

db.connect((err) => {
  if (err){
    throw err
  } else {
    console.log("Database connected")
  }
})

// LOGIN //
const isAuthorized = (request, result, next) => {
  if(typeof(request.headers['x-api-key']) == 'undefined'){
    return result.status(403).json({
      success: false,
      message: 'Unauthorized. Token is not provided'
    })
  }

  let token = request.headers['x-api-key']

  jwt.verify(token, secretKey, (err, decoded) => {
    if (err) {
      return result.status(401).json({
        success: false,
        message: 'Unauthorized. Token is invalid'
      })
    }
  })

  next()
}

app.get('/', (request, result) => {
  result.json({
    success: true,
    message: 'Welcome'
  })
})

app.post('/login', (request, result) => {
  let data = request.body

  if(data.username == 'admin' && data.password == 'admin'){
    let token = jwt.sign(data.username + '|' + data.password, secretKey)

    result.json({
      success: true,
      message: 'Login success, welcome back:)',
      token: token
    })
  }

  result.json({
    success: false,
    message: 'Kamu bukan penjualnya ya?!'
  })
})

// CRUD Pelanggan //
app.get('/pelanggan', (req, res) => {
  let sql = `
      select id_pelanggan, nama_pelanggan, username, password from pelanggan
  `

  db.query(sql, (err, result) => {
    if (err) throw err

    res.json({
      message: "Success get all pelanggan",
      data: result
    })
  })
})

app.post('/pelanggan', (req, res) => {
  let data = req.body

  let sql = `
      insert into pelanggan (id_pelanggan, nama_pelanggan, username, password)
      values('`+data.id_pelanggan+`', '`+data.nama_pelanggan+`', '`+data.username+`', '`+data.password+`')
  `

  db.query(sql, (err, result) => {
    if (err) throw err

    res.json({
      message: "pelanggan created",
      data: result
    })
  })
})

app.put('/pelanggan/:id', (req, res) => {
  let data = req.body

  let sql = `
      update pelanggan
      set id_pelanggan = '`+data.id_pelanggan+`', nama_pelanggan = '`+data.nama_pelanggan+`', username = '`+data.username+`', password = '`+data.password+`'
      where id_pelanggan = '`+req.params.id+`'
  `

  db.query(sql, (err, result) => {
    if (err) throw err

    res.json({
      message: "Data has been updated",
      data: result
    })
  })
})

app.delete('/pelanggan/:id', (req, res) => {
  let sql = `
      delete from pelanggan
      where id_pelanggan = '`+req.params.id+`'
  `

  db.query(sql, (err, result) => {
    if(err) throw err

    res.json({
      message: "data has been deleted",
      data: result
    })
  })
})

app.listen(6104, () => {
  console.log('App is running on port 6104')
})
