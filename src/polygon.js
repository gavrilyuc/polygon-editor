$.fn.polygon = function(properties = {}) {
    var currentElement = this;
    var canvas = this.get(0);
    var context = canvas.getContext('2d');
    var globalProperties = $.extend({
        boneSize: {
            width: 10,
            height: 10
        },
        colors: {
            bone: {
                selected: 'red',
                default: 'rgba(255,0,0,0.6)'
            },
            polygon: {
                selected: 'rgba(255,0,0,0.6)',
                default: 'rgba(0,255,0,0.6)'
            },
            polygonFromType: {
                1: {
                    selected: 'rgba(255,0,0,0.6)',
                    default: 'rgba(0,255,0,0.6)'
                },
                2: {
                    selected: 'rgba(255,0,0,0.6)',
                    default: 'rgba(0,255,0,0.6)'
                },
                3: {
                    selected: 'rgba(255,0,0,0.6)',
                    default: 'rgba(0,255,0,0.6)'
                }
            }
        },
        polygonSelectId: '#polygonType',
        editMode: '#editMode'
    }, properties);
    var polygons = [];
    var __editMode = false;

    function invalidateAll()
    {
        context.clearRect(0, 0, canvas.width, canvas.height);

        if (__editMode)
        {
            currentElement.css('border', '1px solid red');
        }
        else
        {
            currentElement.css('border', '1px solid black');
        }

        polygons = jQuery.grep(polygons, function(polygonItem)
        {
            var result = polygonItem.points.length > 0;
            if (result)
            {
                drawPolygon(polygonItem);
            }

            return result;
        });
        // polygons.forEach(drawPolygon);
    }
    function drawPolygon(polygonItem)
    {
        context.save();
        context.beginPath();
        
        polygonItem.points.forEach(function(p, i)
        {
            context.lineTo(p.x, p.y);
        });
        context.lineTo(polygonItem.points[0].x, polygonItem.points[0].y);
        
        var defaultPolygon = true;

        for(var index in globalProperties.colors.polygonFromType)
        {
            if (polygonItem.polygonType == index)
            {
                var type = globalProperties.colors.polygonFromType[index];

                if (__editMode)
                {
                    context.fillStyle = polygonItem.isSelected ? globalProperties.colors.polygon.selected : type.default;
                }
                else
                {
                    context.fillStyle = polygonItem.isSelected ? type.selected : type.default;
                }

                defaultPolygon = false;
                break;
            }
        }

        if (defaultPolygon)
        {
            context.fillStyle = polygonItem.isSelected ? globalProperties.colors.polygon.selected : globalProperties.colors.polygon.default;
        }
        context.fill();
        context.stroke();
        context.closePath();
        context.restore();

        polygonItem.points.forEach(function(p, i)
        {
            context.save();
            context.translate(p.x, p.y);
            context.fillStyle = p.isSelected ? globalProperties.colors.bone.selected : globalProperties.colors.bone.default;
            context.fillRect(-(globalProperties.boneSize.width / 2), -(globalProperties.boneSize.height / 2),
                globalProperties.boneSize.width, globalProperties.boneSize.height);
            context.restore();
        });
    }

    function createNewPolygon(polygonType, x, y)
    {
        var p = {
            points: [],
            isSelected: false,
            polygonType: polygonType
        };
        
        var point = {
            x: x,
            y: y,
            isSelected: false
        };
        p.points.push(point);

        polygons.push(p);

        return polygons.length - 1;
    }
    function addPointToPolygon(polygonIndex, x, y)
    {
        var point = {
            x: x,
            y: y,
            isSelected: false
        };

        polygons[polygonIndex].points.splice(polygons[polygonIndex].points.length - 1, 0, point);
    }

    function hasPolygonTouch(x, y, polygonIndex)
    {
        var points = polygons[polygonIndex].points;
        var i, j = points.length - 1, touch = false;

        for (i = 0; i < points.length; i++)
        {
            var pxi = points[i].x, pxj = points[j].x,
                pyi = points[i].y, pyj = points[j].y;

            if((((pyi < y && pyj >= y) || (pyj < y && pyi >= y)) && (pxi <= x || pxj <= x))
                &&
                (pxi + (y - pyi) / (pyj - pyi) * (pxj - pxi) < x))
            {
                touch = !touch;
            }
            j = i;
        }

        return touch;
    }
    function getIndexBoneTouch(x, y, polygonIndex)
    {
        var points = polygons[polygonIndex].points;

        // because first element = last
        for(var i = 0; i < points.length; i++)
        {
            // bone located is center point
            var bone = {
                left: points[i].x - (globalProperties.boneSize.width / 2),
                top: points[i].y - (globalProperties.boneSize.height / 2),
                right: points[i].x + globalProperties.boneSize.width,
                bottom: points[i].y + globalProperties.boneSize.height
            };
            
            if ((bone.left <= x && bone.right >= x) && (bone.top <= y && bone.bottom >= y))
            {
                return i;
            }
        }

        return -1;
    }

    function init()
    {
        var _indexTouchedPolygon = -1;
        var _indexTouchedBone = -1;
        var startX = 0, startY = 0;

        $(globalProperties.editMode).click(function (event)
        {
            __editMode = !__editMode;

            if (_indexTouchedPolygon > -1)
            {
                polygons[_indexTouchedPolygon].isSelected = false;
            }

            _indexTouchedPolygon = -1;

            invalidateAll();
        });

        $(currentElement).mousedown(function (event)
        {
            event.preventDefault();
            var x = event.offsetX;
            var y = event.offsetY;

            if (event.which != 1)
            {
                return;
            }

            if (__editMode)
            {
                // select polygon editing
                if (_indexTouchedPolygon == -1)
                {
                    for(var i = 0; i < polygons.length; i++)
                    {
                        if (hasPolygonTouch(x, y, i))
                        {
                            _indexTouchedPolygon = i;
                            polygons[i].isSelected = true;
                            break;
                        }
                    }
                }
                else if (event.ctrlKey)
                {
                    addPointToPolygon(_indexTouchedPolygon, x, y);
                }

                invalidateAll();
                return;
            }

            if (event.ctrlKey && _indexTouchedPolygon == -1)
            {
                _indexTouchedPolygon = createNewPolygon($(globalProperties.polygonSelectId).val(), x, y);
                invalidateAll();
                return;
            }

            if (event.ctrlKey && _indexTouchedPolygon > -1)
            {
                addPointToPolygon(_indexTouchedPolygon, x, y);
                invalidateAll();
                return;
            }

            for(var i = 0; i < polygons.length; i++)
            {
                var boneIndex = getIndexBoneTouch(x, y, i);
                if (boneIndex > -1)
                {
                    if (event.shiftKey)
                    {
                        polygons[i].points.splice(boneIndex, 1);
                        break;
                    }

                    startX = x;
                    startY = y;
                    _indexTouchedBone = boneIndex;
                    _indexTouchedPolygon = i;
                    polygons[i].points[boneIndex].isSelected = true;
                    break;
                }

                if (hasPolygonTouch(x, y, i))
                {
                    if (event.shiftKey)
                    {
                        polygons.splice(i, 1);
                        _indexTouchedPolygon = -1;
                        startX = 0;
                        startY = 0;
                        break;
                    }

                    _indexTouchedPolygon = i;
                    startX = x;
                    startY = y;
                    polygons[i].isSelected = true;
                    break;
                }
            }

            invalidateAll();
        });

        $(currentElement).mousemove(function (event)
        {
            event.preventDefault();
            var x = event.offsetX;
            var y = event.offsetY;

            if (_indexTouchedPolygon == -1 || __editMode)
            {
                return;
            }

            if (_indexTouchedBone > -1 && polygons[_indexTouchedPolygon].points[_indexTouchedBone].isSelected)
            {
                polygons[_indexTouchedPolygon].points[_indexTouchedBone].x = x;
                polygons[_indexTouchedPolygon].points[_indexTouchedBone].y = y;

                invalidateAll();
                return;
            }

            if (!polygons[_indexTouchedPolygon].isSelected)
            {
                return;
            }

            polygons[_indexTouchedPolygon].points.forEach(function (point)
            {
                point.x += x - startX;
                point.y += y - startY;
            });

            startX = x;
            startY = y;
            invalidateAll();
        });

        $(currentElement).mouseup(function (event)
        {
            event.preventDefault();
            var x = event.offsetX;
            var y = event.offsetY;

            if (_indexTouchedPolygon == -1 || __editMode)
            {
                return;
            }

            if (_indexTouchedBone > -1 && polygons[_indexTouchedPolygon].points[_indexTouchedBone].isSelected)
            {
                polygons[_indexTouchedPolygon].points[_indexTouchedBone].x = x;
                polygons[_indexTouchedPolygon].points[_indexTouchedBone].y = y;
                polygons[_indexTouchedPolygon].points[_indexTouchedBone].isSelected = false;

                _indexTouchedPolygon = -1;
                _indexTouchedBone = -1;
                invalidateAll();
                return;
            }

            if (!polygons[_indexTouchedPolygon].isSelected)
            {
                return;
            }

            polygons[_indexTouchedPolygon].points.forEach(function (point)
            {
                point.x += x - startX;
                point.y += y - startY;
                point.isSelected = false;
            });
            polygons[_indexTouchedPolygon].isSelected = false;

            startX = 0;
            startY = 0;
            _indexTouchedPolygon = -1;
            _indexTouchedBone = -1;
            invalidateAll();
        });
    }

    init();
    return {
        loadFromJson: function (stringJson)
        {
            polygons = JSON.parse(stringJson);
            invalidateAll();
        },
        getJson: function ()
        {
            return JSON.stringify(polygons);
        }
    };
};