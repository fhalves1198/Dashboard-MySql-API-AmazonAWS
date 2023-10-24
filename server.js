const express = require("express");
const mysql = require("mysql2");
const app = express();
const cors = require("cors");

app.use(cors());


// Conexão ao mysql amazon AWS
const pool = mysql.createPool({
    host: "database-1.cxpaobbrsntr.us-east-2.rds.amazonaws.com",
    port: 3306,
    user: "admin",
    password: "Tunado98",
    database: "datagtm",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });


// Aqui defino a porta que o servidor vai monitorar

app.listen("3000", () => {
    console.log("Servidor iniciado na porta 3000.");
  });

// Middleware para adicionar o cabeçalho 'Access-Control-Allow-Origin'
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  next();
});

// Middleware para fazer o parse do corpo das requisições como JSON
app.use(express.json());


// Rota de cadastro dos usuários no banco de dados
app.route("/cadastro").post((req, res) => {
  const { email, senha } = req.body;
  const query = "INSERT INTO cadastro (email, senha) VALUES (?, ?)";
  pool.query(query, [email, senha], (err, results) => {
    if (err) {
      console.error(err);
      res.status(500).send("Erro ao cadastrar usuário.");
    } else {
      res.status(200).send("Usuário cadastrado com sucesso.");
      console.log(req.body)
    }
  });
});

// Rota de login do usuário
app.route("/login").post((req, res) => {
    const { email, senha } = req.body;
    const query = "SELECT * FROM cadastro WHERE email = ? AND senha = ?";
    pool.query(query, [email, senha], (err, results) => {
        if (err){
            console.log(err)
            res.status(500).send("Usuário não encontrado")
        } else if(results.length > 0) {

            const token = generateRandomToken(); // Função para gerar um token aleatório (implementação abaixo)
            res.cookie("authToken", token, { httpOnly: true }); // Configura o cookie com o token
            res.status(200).send("Logado com sucesso!")
            console.log(req.body)
        } else {
            res.status(401).send("Credenciais inválidas.");
        }
    })

})

// Rota de consulta no banco de dados
app.route("/consulta").post((req, res) => {
  const { StartDate, EndDate } = req.body;
  

    if (StartDate && EndDate) {
      const start = `${StartDate.slice(8, 10)}.${StartDate.slice(5, 7)}.${StartDate.slice(0, 4)} 00:00:00`
      const end = `${EndDate.slice(8, 10)}.${EndDate.slice(5, 7)}.${EndDate.slice(0, 4)} 23:59:59`
    
  console.log(start)
  console.log(end)
  


const countQuery = `
SELECT
  (SELECT COUNT(*) FROM cadastronova WHERE STR_TO_DATE(\`Register Date\`, '%d.%m.%Y %H:%i:%s') BETWEEN STR_TO_DATE(?, '%d.%m.%Y %H:%i:%s') AND STR_TO_DATE(?, '%d.%m.%Y %H:%i:%s')) AS totalRegisterCount,
  (SELECT COUNT(*) FROM deposit WHERE STR_TO_DATE(\`First Deposit Date\`, '%d.%m.%Y %H:%i:%s') BETWEEN STR_TO_DATE(?, '%d.%m.%Y %H:%i:%s') AND STR_TO_DATE(?, '%d.%m.%Y %H:%i:%s')) AS totalRegisterFtd,
  (SELECT SUM(valor) FROM investimento WHERE STR_TO_DATE(data, '%d.%m.%Y %H:%i:%s') BETWEEN STR_TO_DATE(?, '%d.%m.%Y %H:%i:%s') AND STR_TO_DATE(?, '%d.%m.%Y %H:%i:%s')) AS investimentoValues,
  (SELECT SUM(\`First Deposit Amount\`) FROM deposit WHERE STR_TO_DATE(\`First Deposit Date\`, '%d.%m.%Y %H:%i:%s') BETWEEN STR_TO_DATE(?, '%d.%m.%Y %H:%i:%s') AND STR_TO_DATE(?, '%d.%m.%Y %H:%i:%s')) AS ftdValues,
  (SELECT COUNT(\`First Deposit Amount\`) FROM deposit WHERE STR_TO_DATE(\`First Deposit Date\`, '%d.%m.%Y %H:%i:%s') BETWEEN STR_TO_DATE(?, '%d.%m.%Y %H:%i:%s') AND STR_TO_DATE(?, '%d.%m.%Y %H:%i:%s')) AS ftdCount
`;

    
    
    
    
    pool.query(countQuery, [start, end, start, end, start, end, start, end, start, end], (err, results) => {
      if (err) {
        console.error(err);
        res.status(500).send("Erro ao consultar.");
      } else {
        const totalRegisterCount = results[0].totalRegisterCount
        const totalRegisterFtd = results[0].totalRegisterFtd
        const investimentoValues = results[0].investimentoValues
        console.log(investimentoValues)
        const ftdValues = results[0].ftdValues
        const ftdCount = results[0].ftdCount
        
        res.status(200).send({ totalRegisterCount, totalRegisterFtd, investimentoValues, ftdValues, ftdCount });
        console.log(req.body)
      }
    });
  } else {
    const start = `${StartDate.slice(8, 10)}.${StartDate.slice(5, 7)}.${StartDate.slice(0, 4)}%`
    //CASO A DATA FINAL NÃO ESTIVER PREENCHIDA
    
    const countQuery = `
    SELECT
      (SELECT COUNT(*) FROM cadastronova WHERE \`Register Date\` LIKE ?) AS totalRegisterCount,
      (SELECT COUNT(*) FROM deposit WHERE \`First Deposit Date\` LIKE ?) AS totalRegisterFtd,
      (SELECT SUM(valor) FROM investimento WHERE data LIKE ?) AS investimentoValues,
      (SELECT SUM(\`First Deposit Amount\`) FROM deposit WHERE \`First Deposit Date\` LIKE ?) AS ftdValues,
      (SELECT COUNT(\`First Deposit Amount\`) FROM deposit WHERE \`First Deposit Date\` LIKE ?) AS ftdCount

    `;
    
   
    pool.query(countQuery, [start, start, start, start, start], (err, results) => {
      if (err) {
        console.error(err);
        res.status(500).send("Erro ao consultar.");
      } else {
        const totalRegisterCount = results[0].totalRegisterCount
        const totalRegisterFtd = results[0].totalRegisterFtd
        const investimentoValues = results[0].investimentoValues
        const ftdValues = results[0].ftdValues
        const ftdCount = results[0].ftdCount
        
        res.status(200).send({ totalRegisterCount, totalRegisterFtd, investimentoValues, ftdValues, ftdCount });
        console.log(req.body)
      }
    });

  }
});

function generateRandomToken() {
  // Função para gerar um token aleatório
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}