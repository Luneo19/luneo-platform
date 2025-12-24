module.exports = (req, res) => {
  res.json({
    message: 'Hello from Luneo API!',
    timestamp: new Date().toISOString(),
    status: 'working'
  });
};


