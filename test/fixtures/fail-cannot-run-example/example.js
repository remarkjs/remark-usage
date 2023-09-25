// Require `pi`:
var pi = require('./index.js');

// @ts-expect-error: cause a runtime error.
pi.s.o.m.e.i.n.v.a.l.i.d.j.a.v.a.s.c.r.i.p.t;
