* ENDPOINTS USUARIOS 
* POST api/login 
* POST api/logout   --- > requiereAuth
* POST api/register

* ENDPOINTS MAZOS
* DELETE api/admin/userID
* PATCH api/mazos/:id  ---- > requiereRole

* ENDPOINTS CARTAS
* GET api/cartas/:name
* GET api/cartas/
* GET api/mazos/userId -----> requiereAuth
* POST api/mazos/  ----> requiereAuth
* DELETE api/mazos/:id --> requiereAuth
