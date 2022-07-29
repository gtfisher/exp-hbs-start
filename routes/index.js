const crypto = require('crypto');
var express = require('express');

var router = express.Router();

var app = express();

const authTokens = {};

const generateAuthToken = () => {
  return crypto.randomBytes(30).toString('hex');
};

const getHashedPassword = (password) => {
  const sha256 = crypto.createHash('sha256');
  const hash = sha256.update(password).digest('base64');
  return hash;
};

const users = [
  // This user is added to the array to avoid creating a new user on each restart
  {
    firstName: 'John',
    lastName: 'Doe',
    email: 'johndoe@email.com',
    // This is the SHA256 hash for value of `password`
    password: 'XohImNooBHFR0OVvjcYpJ3NgPQ1qq73WKhHvch0VQtg=',
  },
];

app.use((req, res, next) => {
  const authToken = req.cookies['AuthToken'];
  req.user = authTokens[authToken];
  next();
});

/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('home', { title: 'Home' });
});

router.get('/ind', function (req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/register', (req, res) => {
  res.render('register', { title: 'register' });
});

router.get('/login', (req, res) => {
  res.render('login');
});

router.post('/register', (req, res) => {
  const { email, firstName, lastName, password, confirmPassword } = req.body;

  // Check if the password and confirm password fields match
  if (password === confirmPassword) {
    // Check if user with the same email is also registered
    if (users.find((user) => user.email === email)) {
      res.render('register', {
        message: 'User already registered.',
        messageClass: 'alert-danger',
      });

      return;
    }

    const hashedPassword = getHashedPassword(password);

    // Store user into the database if you are using one
    users.push({
      firstName,
      lastName,
      email,
      password: hashedPassword,
    });

    res.render('login', {
      message: 'Registration Complete. Please login to continue.',
      messageClass: 'alert-success',
    });
  } else {
    res.render('register', {
      message: 'Password does not match.',
      messageClass: 'alert-danger',
    });
  }
});

router.post('/login', (req, res) => {
  const { email, password } = req.body;
  const hashedPassword = getHashedPassword(password);

  const user = users.find((u) => {
    return u.email === email && hashedPassword === u.password;
  });

  if (user) {
    const authToken = generateAuthToken();

    // Store authentication token
    //app.get('authTokens').push(user)
    authTokens[authToken] = user;

    // Setting the auth token in cookies
    res.cookie('AuthToken', authToken);

    // Redirect user to the protected page
    res.redirect('/protected');
  } else {
    res.render('login', {
      message: 'Invalid username or password',
      messageClass: 'alert-danger',
    });
  }
});

const requireAuth = (req, res, next) => {
  if (req.user) {
    next();
  } else {
    res.render('login', {
      message: 'Please login to continue',
      messageClass: 'alert-danger',
    });
  }
};

router.get('/protected', requireAuth, (req, res) => {
  res.render('protected');
});

module.exports = router;
