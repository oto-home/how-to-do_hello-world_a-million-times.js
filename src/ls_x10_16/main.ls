x10 = (f) -> f();f();f();f();f();f();f();f();f();f()

do ->
  print = -> console.log 'Hello, World!'
  x10 -> x10 -> x10 -> x10 -> x10 -> x10 print
