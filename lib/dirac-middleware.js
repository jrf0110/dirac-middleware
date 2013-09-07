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

m.queryObj = function(){
  return function(req, res, next){
    req.queryObj = {};
    req.queryOptions = {};
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

    if (typeof fn == 'function') fn(req.queryObj, value);
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

m.view = function(name, collection, operation){
  operation = operation || 'find';

  return function(req, res){
    if (
      collection && (
        Object.keys( req.queryObj ).length ||
        Object.keys( req.queryObj ).length
      )
    ){
      collection
    } else {
      res.render(name);
    }
  };
}

m.find = function(collection){
  return function(req, res){
    collection.find(req.queryObj, req.queryOptions, function(error, results){
      if (error) return console.log(error), res.status(400).send();

      res.json({ data: results });
    });
  };
};

m.findOne = function(collection){
  return function(req, res){
    collection.findOne(req.queryObj, req.queryOptions, function(error, result){
      if (error) return res.status(400).send();

      if (!result) return res.status(404).end();

      res.json({ data: result });
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

      res.json({ data: results.length > 0 ? results[0] : null });
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

      res.status(200).json({ data: !options.isMultiple ? results[0] : results });
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

      res.status(200).json({ data: results });
    })
  };
};