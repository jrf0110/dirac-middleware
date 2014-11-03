/**
 * Mock express middleware and dirac dal behavior
 */

module.exports = {
  req: {
    body: {}
  , queryOptions: { returning: ['id'] }
  }

, res: {
    json: function(val) { return val; }
  }

, collectionReturningArray: {
    insert: function(body, queryOptions, callback) {
      callback( null, [ {id: 12} ] );
    }
  }

, collectionReturningObj: {
    insert: function(body, queryOptions, callback) {
      callback( null, { id: 42 } );
    }
  }
};
