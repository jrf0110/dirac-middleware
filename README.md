# Dirac Middleware

Common express middleware for handling JSON responses for dirac queries. Calling ```app.use( dm() )``` will put a dirac query and options object on each request. Each middleware function modifies those two objects. There are some generic route handlers that will then take the query object and options, pass it along to dirac, and then pass the data back to the client.

## Usage

```javascript
var dirac = reuqire('dirac');
var dm = require('dirac-middleware');
var app = express();

app.configure(function(){
  // Initialize dirac query objects on each request
  app.use( dm() );
});

app.get( '/api/users'
  // pagination to add limit|offset support defaulting limit to 30
, dm.pagination( 'pagination', 30 )

  // Set table.some_condition = /users?some_condition defaulting to true
, dm.param( 'some_condition', true /* Default value for param */ )

  // Non-standard parameter? Set your own behavoir
, dm.param( 'created_at', function( $query, options, created_at ){
    // Where "table"."created_at" > $1
    $query.created_at = { $gt: created_at };

    // Ensure that an order by array exists on the options
    if ( !options.order ) options.order = [];
    // Since we're querying by, we should sort by it now
    options.order.push({ column: 'created_at', direction: 'desc' });
  }

  // Use the query obj and options on the request to
  // build a standard select query on users
  // send a json result
, dm.find( dirac.dals.users )
);

app.get( '/api/users/:id'
  // where "users"."id" = :id
, dm.param( 'id' )

  // One result only returns the object
, dm.findOne( dirac.dals.users )
);

// Render user view
app.get( '/users/:id'
, dm.param( 'id' )
, dm.returning( 'id', 'name' )
, dm.view( 'single_user_view', db.users )
);
```

## API

All middleware functions will accept a function as their last parameter to provide custom behavior. They all follow this pattern:

```javascript
// The rest of the params to the function depend on the helper
// they usually have something to do with the functionality of the helper itself
// for instance, the param helper passes in the value of the parameter in the URI
dm.middleware_fn_name( 'some_arg', function( $query, options, ... ){
  /* custom behavior */
})
```

### ```root( [options] )```

The exported value for this module is actually a middleware function to be used within the express ```app.use``` function:

__Example:__

```javascript
var dirac = reuqire('dirac');
var dm = require('dirac-middleware');
var app = express();

app.configure(function(){
  // Initialize dirac query objects on each request
  app.use( dm({ envelope: true }) );
});
```

__Parameters__:

```
* [options]
  + envelope - Whether or not the response should enveloped
               e.g { data: [/*...*/] } rather than just: [/*...*/]
               Default: false
```

### ```dm.queryObj```

The ```root``` function is actually an alias for this function

### ```dm.sort( [default_field], [custom_fn] )```

Sort on a field.

__Parameters:__

```
* default_field [optional] - The default field to always be applied
* custom_fn     [optional] - Custom behavior ( $query, options, sort )
```

__Example:__

```
-- name descending
/api/users?sort=-name
```

```javascript
app.get( '/api/users'
  // By default, there is no sort
, dm.sort()
/* ... */
);

// To sort by name descending by default
app.get( '/api/users'
, dm.sort( '-name' )
/* ... */
);
```

### ```dm.param( field, [default], [custom_fn] )

Map a query param field to a where condition.

__Parameters:__

```
* field     [required] - Fieldname to map
* default   [optional] - Default value for condition
* custom_fn [optional] - Custom behavior ( $query, options, field_value )
```

__Example:__

```javascript
app.get( '/api/users/:id'
  // Map ?id to "users"."id" in the where
, dm.param( 'id' )
/* ... */
);

// To Custom condition behavior
app.get( '/api/users'
, dm.param( 'created_at', function( $query, options, created_at ){
    // Where "table"."created_at" > $1
    $query.created_at = { $gt: created_at };

    // Ensure that an order by array exists on the options
    if ( !options.order ) options.order = [];
    // Since we're querying by, we should sort by it now
    options.order.push({ column: 'created_at', direction: 'desc' });
  })
/* ... */
);
```

### ```dm.returning( fields, fieldB, fieldC, ... )```

Defines what fields the query should return. Either pass in an array of fields or pass in each field individually as arguments.

__Example:__

```javascript
app.get( '/api/users'
, dm.returning([ 'id', 'name' ])
  // Or
, dm.returning( 'id', 'name' )
);
```

## Generic Routes

Some of the functions in this module expect to be route handlers. Since we're building up these query objects that just end up passing the data straight from the DB to the client, it makes sense to create generic route handlers.

### ```dm.view( view_name, [dirac_collection], [options] )```

__Parameters:__

```
* view_name         [required] - Name of the view to render
* dirac_collection  [optional] - Reference to the dirac collection needing to perform
                                 the query. If none is passed, no data extra data will
                                 be passed to the view
* options           [optional] - Object that will be passed to the render function. Can
                                 also be used to specify which dirac.dal method to use
                                 e.g. find, findOne, update, etc...
```

__Example:__

```javascript
// Render user view
app.get( '/users/:id'
, dm.param( 'id' )
, dm.returning( 'id', 'name' )
, dm.view( 'single_user_view', db.users, {
    layout: 'admin/layout'
  })
);
```

__Special Options:__

To override `error` and `not found` behavior:

```javascript
app.get( '/users/:id'
, dm.param( 'id' )
, dm.returning( 'id', 'name' )
, dm.view( 'single_user_view', db.users, {
    layout: 'admin/layout'
  , notFound: function( req, res ){ res.render('404'); }
  , error: function( error, req, res ){ res.render('error', { error: error }); }
  })
);
```

### TODO: FINISH DOCS