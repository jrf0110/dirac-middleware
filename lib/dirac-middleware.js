var pluralize = require('pluralize');

// alias module to easily include
var m = module.exports = function(){
  return m.queryObj();
};

m.logQuery = function(){
  return function(req, res, next){
    console.log(req.queryObj);
    console.log(req.queryOptions);
    next();
  };
};

m.queryObj = function( options ){
  var defaults = {
    envelope: false
  };

  options = options || {};

  for ( var key in defaults ){
    if ( !(key in options) ) options[ key ] = defaults[ key ];
  }

  return function(req, res, next){
    req.queryObj = {};
    req.queryOptions = {
      envelope: !!options.envelope
    };
    next();
  }
};

m.sort = function(_sort){
  return function(req, res, next){
    var direction = "desc", sort = req.param('sort') || _sort;

    if (sort[0] == '+')
      direction = "asc";

    req.queryOptions.order = sort.substring(1) + " " + direction;

    next();
  }
};

m.param = function(field, def, fn){
  if (typeof def == 'function') fn = def, def = null;

  return function(req, res, next){
    var value = req.param(field) || def;

    if (value == undefined || value == null) return next();

    if (typeof fn == 'function') fn(value, req.queryObj, req.queryOptions);
    else req.queryObj[field] = value;
    next();
  };
};

m.validation = function(schema){
  return function(req, res, next){
    next();
  };
};

m.queryValidation = function(schema){
  return function(req, res, next){
    next();
  };
};

m.permissions = function(schema){
  return function(req, res, next){
    next();
  };
};

m.pagination = function(limit, offset){
  offset = offset || 0;

  return function(req, res, next){
    req.queryOptions.offset = req.param('offset') || offset;
    req.queryOptions.limit = req.param('limit') || limit;

    next();
  };
};

m.returning = function(args){
  if ( !Array.isArray(args) )
    args = Array.prototype.slice.call(arguments, 0);
  return function(req, res, next){
    if (args.length == 0) return next();

    if (req.queryOptions.returning)
      req.queryOptions.returning = req.queryOptions.returning.concat(args);
    else
      req.queryOptions.returning = [].concat(args);

    next();
  };
};

m.view = function(name, collection, options){
  if ( collection && !(collection instanceof dirac.DAL) ){
    options = collection;
    collection = null;
  }

  options = options || {};
  options.method = options.method || 'find';

  return function(req, res){
    collection = collection || req.collection;

    if ( collection ){
      var args;
      switch ( options.method ){
        case 'find': case 'findOne': case 'remove':
          args = [ req.queryObj, req.queryOptions ];
        break;
        case 'insert':
          args = [ req.body, req.queryOptions ];
        break;
        case 'update':
          args = [ req.queryObj, req.body, req.queryOptions ];
        break;
        default: break;
      }

      args.push( function( error, results ){
        res.locals[
          // If results is an array, we want to set the local
          // view variable to the plural form of that object type
          // otherwise, use the singular form
          Array.isArray( results )
            ? collection.table
            : pluralize.singular( collection.table )
        ] = results;

        res.render( name, options );
      });

      collection[ options.method ].apply( collection, args );
    } else {
      res.render( name, options );
    }
  };
};

m.find = function(collection){
  return function(req, res){
    collection.find(req.queryObj, req.queryOptions, function(error, results){
      if (error) return console.log(error), res.status(400).send();

      var val = results;

      if ( req.queryOptions.envelope ){
        val = { data: val }
      }

      res.json(val);
    });
  };
};

m.findOne = function(collection){
  return function(req, res){
    collection.findOne(req.queryObj, req.queryOptions, function(error, result){
      if (error) return res.status(400).send();

      if (!result) return res.status(404).end();

      var val = result;

      if ( req.queryOptions.envelope ){
        val = { data: val }
      }

      res.json(val);
    });
  }
};

m.insert = function(collection){
  return function(req, res){
    if (!req.queryOptions.returning)
      req.queryOptions.returning = ['id'];

    collection.insert(req.body, req.queryOptions, function(error, results){
      if (error) return console.log(error), res.status(400).send();

      if (!req.queryOptions.returning || req.queryOptions.returning.length == 0)
        return res.status(204).end();

      var val = results.length > 0 ? results[0] : null;

      if ( req.queryOptions.envelope ){
        val = { data: val }
      }

      res.json(val);
    })
  };
};

m.update = function(collection, options){
  options = options || {};

  return function(req, res){
    collection.update(req.queryObj, req.body, req.queryOptions, function(error, results){
      if (error) return console.log(error), res.status(400).send();

      if (results && results.length == 0) return res.status(404).end();

      if (!req.queryOptions.returning || req.queryOptions.returning.length == 0)
        return res.status(204).end();

      var val = !options.isMultiple ? results[0] : results;

      if ( req.queryOptions.envelope ){
        val = { data: val }
      }

      res.status(200).json(val);
    })
  };
};

m.remove = function(collection){
  return function(req, res){
    collection.remove(req.queryObj, req.queryOptions, function(error, results){
      if (error) return res.status(400).send();

      if (results && results.length == 0) return res.status(404).end();

      if (!req.queryOptions.returning || req.queryOptions.returning.length == 0)
        return res.status(204).end();

      var val = results;

      if ( req.queryOptions.envelope ){
        val = { data: val }
      }

      res.status(200).json(val);
    })
  };
};