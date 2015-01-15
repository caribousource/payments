# What is this?

This is a small service that generates bitcoin addresses for
users in a pre-existing site database. It includes a frontend
server for local testing and includes support for generating
testnet addresses for sending testnet coins to.

# Configuration
Put this in config.json. The DB assumes a few fields, like
username, authkey (varchar 40), btckey (varchar 52).
```
{
  "mysqlDatabase": "yourdatabase",
  "mysqlUsername": "yourusername",
  "mysqlPassword": "yourpassword",
  "mysqlSocketPath": "/var/run/mysqld/mysqld.sock",
  "testnet": true
}
```
