module IML

export
    visualize,
    RandomExplainer,
    ESValuesExplainer

include("datatypes.jl")
include("common.jl")
include("links.jl")
include("explanations.jl")

abstract Explainer
#include("explainers/random.jl")
include("explainers/esvalues.jl")

include("visualizers.jl")

# dump our JS code to the notebook (if present)
bundlePath = joinpath(dirname(@__FILE__), "..", "javascript", "build", "bundle.js")
logoPath = joinpath(dirname(@__FILE__), "..", "javascript", "build", "logoSmallGray.png")
logoSmall = base64encode(open(readstring, logoPath))
function initjs()
    display(HTML("<div align='center'><img src='data:image/png;base64,$logoSmall' /></div><script>$(readstring(bundlePath))</script>"))
end # isdefined(:IJulia) &&

end
