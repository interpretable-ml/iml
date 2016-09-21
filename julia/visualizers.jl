using JSON
using Clustering

visualize(e::Explanation) = visualize(e, AdditiveForceVisualizer())
visualize(e::Explanation, v) = visualize(e, v)
Base.show(io::IO, ::MIME"text/html", e::Explanation) = print(io, visualize(e, AdditiveForceVisualizer()).content)
Base.show(io::IO, ::MIME"text/html", arr::Array{Explanation}) = print(io, visualize(arr, AdditiveForceVisualizer()).content)

errMsg = "<div style='color: #900; text-align: center;'><b>Visualization omitted, iML Javascript library not loaded!</b><br>If this notebook was from another user you must trust this notebook. This error can also occur if the iML library was not imported in this notebook.</div>"

type SimpleListVisualizer
end
function visualize(e::Explanation, v::SimpleListVisualizer)
    data = Dict(
        "outNames" => e.model.outNames,
        "baseValue" => e.baseValue,
        "link" => convert(String, e.link),
        "features" => [Dict("name" => e.data.groupNames[i], "effect" => e.effects[i]) for i in 1:length(e.data.groupNames)]
    )
    HTML("<simple-list explanation='$(json(data))'>$errMsg</simple-list>")
end

type AdditiveForceVisualizer
end
function visualize(e::Explanation, v::AdditiveForceVisualizer)
    data = Dict(
        "outNames" => e.model.outNames,
        "baseValue" => e.baseValue,
        "link" => convert(String, e.link),
        "features" => [Dict(
            "name" => e.data.groupNames[i],
            "effect" => e.effects[i],
            "value" => length(e.data.groups[i]) == 1 ? e.x[e.data.groups[i][1]] : nothing
        ) for i in 1:length(e.data.groupNames)]
    )
    HTML("<additive-force explanation='$(json(data))'>$errMsg</additive-force>")
end
function visualize(arr::Array{Explanation}, v::AdditiveForceVisualizer)
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

    data = [Dict(
        "outNames" => e.model.outNames,
        "baseValue" => e.baseValue,
        "link" => convert(String, e.link),
        "features" => [Dict(
            "name" => e.data.groupNames[i],
            "effect" => e.effects[i],
            "value" => length(e.data.groups[i]) == 1 ? e.x[e.data.groups[i][1]] : nothing
        ) for i in 1:length(e.data.groupNames)]
    ) for e in arr[clustOrder]]

    HTML("<additive-force-array explanations='$(json(data))'>$errMsg</additive-force-array>")
end
