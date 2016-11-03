import Base: convert

type Instance
    x
    groupDisplayValues
    groups::Nullable{Array{Array{Int64,1}}}
end
function Instance(x::Array, groupDisplayValues)
    Instance(x, groupDisplayValues, Nullable{Array{Array{Int64,1}}}())
end
convert(::Type{Instance}, x::Array) = Instance(x, nothing)
function match_data!(instance::Instance, data::DenseData)
    if instance.groupDisplayValues == nothing
        instance.groupDisplayValues = [length(group) == 1 ? instance.x[group[1]] : "" for group in data.groups]
    end
    @assert length(instance.groupDisplayValues) == length(data.groups)
    instance.groups = data.groups
end

type Model
    f::Function
    outNames
end
convert(::Type{Model}, f::Function) = Model(f, nothing)
function match_data!(model::Model, data::DenseData)
    local outVal
    try
        outVal = model.f(data.data)
    catch err
        error("Provided model function fails when applied to the provided data set: ", err)
    end

    if model.outNames == nothing
        if length(size(outVal)) == 1
            model.outNames = [""]
        else
            model.outNames = ["" for i in 1:size(outVal)[2]]
        end
    end
end
