var assert = require("assert");
var dm = require('../lib/dirac-middleware');
var mocks = require('./mocks');

describe('Dirac-Middleware', function(){
  describe('#insert()', function(){
    it('should respond given object', function(done){
      var insertMw = dm.insert(mocks.collectionReturningObj);
      var res = {
        json: function(val) {
          assert(val && typeof val === 'object');
          done();
        }
      }
      insertMw(mocks.req, res);
    });
    it('should respond given array', function(done){
      var insertMw = dm.insert(mocks.collectionReturningArray);
      var res = {
        json: function(val) {
          assert(val && typeof val === 'object');
          done();
        }
      }
      insertMw(mocks.req, res);
    });
  });
});
