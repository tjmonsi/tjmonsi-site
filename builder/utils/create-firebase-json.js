const getConfig = require('./get-config');

module.exports = () => {
  const {config} = getConfig();
  const firebase = {
    database: {
      rules: 'database.rules.json'
    },
    firestore: {
      rules: 'firestore.rules',
      indexes: 'firestore.indexes.json'
    },
    storage: {
      rules: 'storage.rules'
    },
    hosting: config.hosting
  };

  for (var j in firebase.hosting.rewrites) {
    if (firebase.hosting.rewrites[j].source === '**') {
      firebase.hosting.rewrites.splice(j, 1);
    }
  }

  for (var i in config.routing) {
    if (!firebase.hosting.rewrites) {
      firebase.hosting.rewrites = [];
    }
    firebase.hosting.rewrites.push({
      source: i.split('/').map(path => (path.indexOf(':') === 0 ? '**' : path)).join('/'),
      destination: '/index.html'
    });
    var arr = i.split('/');

    while (arr.length > 0) {
      if (arr[arr.length - 1].indexOf(':') === 0 && arr[arr.length -1].indexOf('?') === arr[arr.length - 1].length - 1) {
        arr.pop();
        firebase.hosting.rewrites.push({
          source: arr.map(path => (path.indexOf(':') === 0 ? '**' : path)).join('/'),
          destination: '/index.html'
        });
      } else {
        break;
      }
    }
  }

  firebase.hosting.public = 'public';
  return JSON.stringify(firebase, null, 2);
};
