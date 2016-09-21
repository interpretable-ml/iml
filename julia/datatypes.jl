abstract Data

type DenseData <: Data
    groupNames::Array{String}
    data::Matrix
    transposed::Bool
    weights::Vector
    groups::Array{Array{Int64,1}}
end
function DenseData(groupNames::Array{String}, data::Matrix)
    l = length(groupNames)
    numSamples = size(data)[1]
    transposed = false
    if l != size(data)[2]
        transposed = true
        numSamples = size(data)[2]
    end
    @assert l == size(data)[2] || transposed "# of names must match data matrix!"
    DenseData(groupNames, data, transposed, ones(numSamples), [[i] for i in 1:l])
end
DenseData(data::DataFrames.DataFrame) = DenseData(string.(names(data)), convert(Array, data))
