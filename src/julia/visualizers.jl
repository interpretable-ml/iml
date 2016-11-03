using JSON
using Clustering

visualize(e::Explanation) = visualize(e, SimpleListVisualizer())
visualize(e::AdditiveExplanation) = visualize(e, AdditiveForceVisualizer())
Base.show(io::IO, ::MIME"text/html", e::Explanation) = print(io, visualize(e, SimpleListVisualizer()).content)
Base.show(io::IO, ::MIME"text/html", e::AdditiveExplanation) = print(io, visualize(e, AdditiveForceVisualizer()).content)
Base.show(io::IO, ::MIME"text/html", arr::Array{AdditiveExplanation}) = print(io, visualize(arr, AdditiveForceVisualizer()).content)

errMsg = "<div style='color: #900; text-align: center;'><b>Visualization omitted, iML Javascript library not loaded!</b><br>Have you run `IML.initjs()` in this notebook? If this notebook was from another user you must also trust this notebook (File -> Trust notebook).</div>"

type SimpleListVisualizer
end
function visualize(e::Explanation, v::SimpleListVisualizer)
    data = Dict(
        "outNames" => e.model.outNames,
        "baseValue" => e.baseValue,
        "link" => convert(String, e.link),
        "featureNames" => e.data.groupNames,
        "features" => Dict(i-1 => Dict(
            "effect" => e.effects[i],
            "value" => e.instance.groupDisplayValues[i]
        ) for i in filter(j->e.effects[j] != 0, 1:length(e.data.groupNames)))
    )

    id = randstring(20)
    return HTML(
"""
<div id='$id'>$errMsg</div>
 <script>
   if (window.IML) IML.ReactDom.render(
    IML.React.createElement(IML.SimpleListVisualizer, $(json(data))),
    document.getElementById('$id')
  );
</script>
"""
    )
end

type AdditiveForceVisualizer
end
function visualize(e::AdditiveExplanation, v::AdditiveForceVisualizer)
    data = Dict(
        "outNames" => e.model.outNames,
        "baseValue" => e.baseValue,
        "outValue" => e.outValue,
        "link" => convert(String, e.link),
        "featureNames" => e.data.groupNames,
        "features" => Dict(i-1 => Dict(
            "effect" => e.effects[i],
            "value" => e.instance.groupDisplayValues[i]
        ) for i in filter(j->e.effects[j] != 0, 1:length(e.data.groupNames)))
    )

    id = randstring(20)
    return HTML(
"""
<div id='$id'>$errMsg</div>
 <script>
   if (window.IML) IML.ReactDom.render(
    IML.React.createElement(IML.AdditiveForceVisualizer, $(json(data))),
    document.getElementById('$id')
  );
</script>
"""
    )
end
function visualize(arr::Array{AdditiveExplanation}, v::AdditiveForceVisualizer)
    # # make sure all the links and
    # @assert all([e.link == arr[1].link for e in arr])
    # @assert all([e.model == arr[1].model for e in arr])
    # @assert all([e.data == arr[1].data for e in arr])

    local clustOrder
    if all([e.model.f == arr[1].model.f for e in arr])
        m = hcat([e.effects for e in arr]...)
        D = vcat([sum((m .- m[:,i]).^2, 1) for i in 1:size(m)[2]]...)
        clustOrder = hclust(D, :complete).order
    else
        error("Tried to visualize an array of explanations from different models!")
    end

    # make sure that we put the higher predictions first...just for consistency
    if sum(arr[clustOrder[1]].effects) < sum(arr[clustOrder[end]].effects)
        reverse!(clustOrder)
    end

    clustOrder = invperm(clustOrder)
    data = Dict(
        "outNames" => arr[1].model.outNames,
        "baseValue" => arr[1].baseValue,
        "link" => convert(String, arr[1].link),
        "featureNames" => arr[1].data.groupNames,
        "explanations" => [Dict(
            "outValue" => e.outValue,
            "simIndex" => clustOrder[ind],
            "features" => Dict(i-1 => Dict(
                "effect" => e.effects[i],
                "value" => e.instance.groupDisplayValues[i]
            ) for i in filter(j->e.effects[j] != 0 || e.instance.x[j] != 0, 1:length(e.data.groupNames)))
        ) for (ind, e) in enumerate(arr)]
    )

    id = randstring(20)
    return HTML(
"""
<div id='$id'>$errMsg</div>
 <script>
   if (window.IML) IML.ReactDom.render(
    IML.React.createElement(IML.AdditiveForceArrayVisualizer, $(json(data))),
    document.getElementById('$id')
  );
</script>
"""
    )
end
