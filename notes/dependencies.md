# Dependencies Manager


### App level dependencies

apps load deps via extensions
apps can be stopped 
deps should be cleaned up when the app stops

#### the problem : 

there may be multiple apps in the page, 
we don't know for sure if a dep can be safely unloaded when an app is stopped

#### the solution ?

deps registry to keep track of the deps graph + ref count

### Widget level dependencies

Same thing as app ?

--- 

# Questions

### what does registerDeps/unregisterDeps do? are they a layer on top of requirejs dependencies? for caching ? any limitations / potentials for collsions / rules that come from this?



