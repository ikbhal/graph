const express = require('express');
const session = require('express-session');
const flash = require('connect-flash');
const neo4j = require('neo4j-driver');
const neo4jUsername = 'neo4j';
const neo4jPassword = 'neo4j';
const driver = neo4j.driver('bolt://localhost:7687', neo4j.auth.basic(neo4jUsername, neo4jPassword));

const app = express();
const PORT = process.env.PORT || 3024;

// Middleware
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));
app.use(session({
    secret: 'your-secret-key',
    resave: true,
    saveUninitialized: true
}));
app.use(flash());

// Routes
app.post('/add-node', async (req, res) => {
    const session = driver.session();
    const nodeName = req.body.nodeName;

    try {
        await session.run('CREATE (n:Node {name: $name})', { name: nodeName });
        req.flash('message', 'Node added successfully!');
    } catch (error) {
        req.flash('message', 'Error adding node.');
    } finally {
        session.close();
        res.redirect('/');
    }
});

app.get('/', async (req, res) => {
    const session = driver.session();

    try {
        const result = await session.run('MATCH (n:Node) RETURN n.id AS id, n.name AS name');
        const nodes = result.records.map(record => ({
            id: record.get('id'),
            name: record.get('name')
        }));

        res.render('index', { message: req.flash('message'), nodes });
    } catch (error) {
        req.flash('message', 'Error fetching nodes.');
        res.render('index', { message: req.flash('message'), nodes: [] });
    } finally {
        session.close();
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
