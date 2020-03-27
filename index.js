const express = require('express')
const mysql = require('mysql')
const bodyParser = require('body-parser')
const jwt = require('jsonwebtoken')

// mendeklarasikan variabel app
const app = express()

// inisialisasi secretkey
const secretKey = 'thisisverysecretkey'

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({
  extended: true
}))

// membuat koneksi ke database
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

// CRUD Barang //
app.get('/barang', (req, res) => {
  let sql = `
      select id_barang, jenis, isi_volume, stok, harga from barang
  `

  db.query(sql, (err, result) => {
    if (err) throw err

    res.json({
      message: "success get all data",
      data: result
    })
  })
})

app.post('/barang', (req, res) => {
  let data = req.body

  let sql = `
      insert into barang (id_barang, jenis, isi_volume, stok, harga)
      values ('`+data.id_barang+`', '`+data.jenis+`', '`+data.isi_volume+`', '`+data.stok+`', '`+data.harga+`')
  `

  db.query(sql, (err, result) => {
    if (err) throw err

    res.json({
      message: "data created",
      data: result
    })
  })
})

app.get('/barang/:id', (req, res) => {
  let sql = `
      select * from barang
      where id_barang = `+req.params.id+`
      limit 1
  `

  db.query(sql, (err, result) => {
    if (err) throw err

    res.json({
      message: "success get data detail",
      data: result[0]
    })
  })
})

app.put('/barang/:id', (req, res) => {
  let data = req.body

  let sql = `
        update barang
        set id_barang = '`+data.id_barang+`', jenis = '`+data.jenis+`', isi_volume = '`+data.isi_volume+`', stok = '`+data.stok+`', harga = '`+data.harga+`'
        where id_barang = '`+req.params.id+`'
  `

  db.query(sql, (err, result) => {
    if (err) throw err

    res.json({
      message: "data has been updated",
      data: result
    })
  })
})

app.delete('/barang/:id', (req , res) => {
  let sql = `
        delete from barang
        where id_barang = '`+req.params.id+`'
  `

  db.query(sql, (err, result) => {
    if (err) throw err

    res.json({
      message: "data has been deleted",
      data: result
    })
  })
})

// Transaksi //
app.post('/barang/:id/take', (req, res) => {
  let data = req.body

  db.query(`
    insert into transaksi (id_pelanggan, id_barang)
    values ('`+data.id_pelanggan+`', '`+data.id_barang+`')
    `, (err, result) => {
      if (err) throw err
    })

    db.query(`
      update barang
      set stok = stok - 1
      where id_barang = '`+req.params.id+`'
      `, (err, result) => {
        if (err) throw err
      })

      res.json({
        message: "Barang sudah dibeli oleh pelanggan:)"
      })
})

app.get('/pelanggan/:id/barang', (req, res) => {
  db.query(`
    select barang.jenis, barang.isi_volume, barang.stok, barang.harga
    from pelanggan
    right join transaksi on pelanggan.id_pelanggan = transaksi.id_pelanggan
    right join barang on transaksi.id_barang = barang.id_barang
    where pelanggan.id_pelanggan = '`+req.params.id+`'
    `, (err, result) => {
      if (err) throw err

      res.json({
        message: "Transaksi barang sukses!",
        data: result
      })
    })
})

// Run Application
app.listen(6104, () => {
  console.log('App is running on port 6104')
})
