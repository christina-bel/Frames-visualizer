var filejson;
var json;
var cy;

$(document).ready(function(){
  cy = cytoscape(
    {
      container: document.getElementById('cy'),
      autounselectify: true,
      boxSelectionEnabled: false,
      userZoomingEnabled: true,
      style: [
        {
          // стиль узла
          selector: 'node',
          style: {
            shape: 'round-rectangle',
            'background-color': '#00BFFF',
            'color': 'black',
            'border-color' : 'black',
            'border-width' : 2,
             width: 'label',
             padding: 20,
             height: 60,
            'content': 'data(name)',
            'text-valign': 'center',
            'text-halign': 'center',
            'font-size': 16,
             'line-height': 2,
             'text-wrap': 'wrap',
             'text-max-width' : 110
          }

        },
          {
              // стиль родительского узла
              selector: ':parent',
              style: {

                  shape: 'round-rectangle',
                  'background-color': '#B0E0E6',
                  'color': 'black',
                  'border-color' : 'black',
                  'border-width' : 3,
                  width: 370,
                  height: 370,
                  'content': 'data(name)',
                  'text-valign': 'top',
                  'text-halign': 'center',
                  'font-size': 27,
                  'text-wrap': 'wrap',
                  'text-max-width' : 270,
                  'line-height': 2
              }
          },

        {
          selector: 'edge',
          style: {
            'curve-style': 'bezier',           // форма ребра
            'target-arrow-shape': 'triangle',  // окончание ребра - в виде стрелки
            'target-arrow-color': 'grey',
            'width': 1, // толщина ребра
             'font-size': 15,
             'font-weight': 'bold',
            'line-color': 'grey',       // цвет линии ребра
              "target-text-offset": 80,
              "target-text-rotation": "autorotate",
              "target-label": 'data(label)'// подпись ребра
          }
        }
      ],

      layout: [
        {
          name: 'circle',
          padding: 5
        }
      ]

    }
  );
})

function AddNode() {
    document.getElementById("EdgesSlots").disabled = false;
    document.getElementById("EdgesFrames").disabled = false;
    filejson = document.getElementById("Data").value;
    var obj = JSON.parse(filejson);
    var pos = createPos(obj['frames'], 100*obj['frames'].length);
    // добавляем фреймы
    for (var i = 0; i < obj['frames'].length; i++) {
        cy.add(
            [
                {
                    data: {id: obj['frames'][i]['code'], name: obj['frames'][i]['name']}
                }
            ]
        );
    }
        // добавляем слоты
        for (var i = 0; i < obj['frames'].length; i++)
        {
            var k = Math.floor(obj['frames'][i]['slots'].length / 2);
            for (var j = 0; j < obj['frames'][i]['slots'].length; j++)
            {
                cy.add(
                    [
                        {
                            data: {
                                id: obj['frames'][i]['code'] + obj['frames'][i]['slots'][j]['code'],
                                name: obj['frames'][i]['slots'][j]['name'] + " (" + obj['frames'][i]['slots'][j]['code'] +")",
                                parent: obj['frames'][i]['code']
                            },
                            position: { x: pos[i]['x'], y: pos[i]['y']+(j-k)*110 }
                        }]
                );
            }
        }

    var firstEl = getIdOfCenter(obj, 0);
    var preLastEl = getIdOfCenter(obj, obj['frames'].length-2);
    // изменяем положение первого элемента в случае не симметричного расположения (зависит от числа фреймов)
    if(Math.floor(cy.getElementById(firstEl).position('y')) != Math.floor(cy.getElementById(preLastEl).position('y'))) {
            var k = Math.floor(obj['frames'][0]['slots'].length / 2);
            for (var j = 0; j < obj['frames'][0]['slots'].length; j++)
            {
                var elem = obj['frames'][0]['code'] + obj['frames'][0]['slots'][j]['code'];
                cy.getElementById(elem).position('x', pos[0]['x']+20*obj['frames'].length);
                cy.getElementById(elem).position('y', pos[0]['y']+(j-k)*110 - 30);
            }
        }

    // удобное видение элементов
        cy.fit(3);
        var fitMaxZoom = 0.4;
        if (cy.zoom() > fitMaxZoom) {
            cy.zoom(fitMaxZoom);
            cy.center();
        }
}

// создаем позицию слотов
function createPos(Nodes, radius) {
    var numNodes = Nodes.length;
    var nodes = [],
        width = (radius * 2) + 50,
        height = (radius * 2) + 50,
        angle, // угол
        x, // координаты х
        y; // координаты у
    for (var i = 0; i < numNodes; i++) {
        angle = (i / (numNodes/2)) * Math.PI;
        x = (radius * Math.cos(angle)) + (width/2) ;
        y = (radius * Math.sin(angle)) + (height/2);
        nodes.push({'id': i, 'x': x, 'y': y});
    }
    return nodes;
}

// для получения id центральных слотов
function getIdOfCenter(nodes, num) {
    var center = Math.floor(nodes['frames'][num]['slots'].length / 2);
    var elem = nodes['frames'][num]['code'] + nodes['frames'][num]['slots'][center]['code'];
    return elem;
}

var strReverse = str => str.split('=>').reverse().join('=>'); // разворот строки

function newEdges(from, to, getterKey, inf)
{
    var influenceKeys = Object.keys(JSON.parse(inf));
    for (var z = 0; z < influenceKeys.length; z++)
    {
        var str1 = getterKey + "=>";
        str1+=influenceKeys[z];
        var infValue = JSON.parse(inf)[influenceKeys[z]];
        var pathToTarget = typeof (infValue) === 'number' ? infValue : (JSON.stringify(infValue) + " => " + strReverse(str1));
        var valueEdge = typeof (infValue) === 'number' ? infValue : getValue(infValue);
        cy.add(
             [
                  {
                      data: {
                          id: from + influenceKeys[z] + "=>" + to + getterKey + " : " + pathToTarget,
                          source: from + influenceKeys[z],
                          target: to + getterKey,
                          label: valueEdge
                      }
                  }
              ]
          );
    }
}

function getValue(inf) {
    var influenceKeys = Object.keys(inf);
    if (influenceKeys.length==0) {
        return "";
    }
    else {
        var inf_string = "";
        for (var i = 0; i < influenceKeys.length; i++) {
            inf_string+=inf[influenceKeys[i]]+"*"+influenceKeys[i];
            if (i+1!=influenceKeys.length)
                inf_string+=", ";
        }
        return inf_string;
    }
}


// добавление влияния слотов
function SlotEdges() {
    cy.$('edge').remove(); //удаляем влияние фреймов
    filejson = document.getElementById("Data").value;
    var obj = JSON.parse(filejson);
    // добавляем стрелочки (влияние слотов друг на друга)
    for (var i = 0; i < obj['edges'].length; i++)
    {
        var keysl = Object.keys(obj['edges'][i]['influence']);
        for (var j = 0; j < keysl.length; j++)
        {
            var str = JSON.stringify(obj['edges'][i]['influence'][keysl[j]]);
            newEdges(obj['edges'][i]['from'], obj['edges'][i]['to'], keysl[j], str);
        }
    }
    showPath();
}

function FrameEdges() {
    cy.$('edge').remove(); //удаляем влияние слотов
    filejson = document.getElementById("Data").value;
    var obj = JSON.parse(filejson);
    // добавляем влияние фреймов
    for (var i = 0; i < obj['edges'].length; i++)
    {
        cy.add(
            [
                {
                    data: {
                        id: obj['edges'][i]['from'] + " => " + obj['edges'][i]['to'],
                        source:obj['edges'][i]['from'],
                        target: obj['edges'][i]['to']
                    }
                }]
        );
    }
    showPath();
}

// удаление всех графов
function ClearSpace() {
    document.getElementById("EdgesSlots").disabled = true;
    document.getElementById("EdgesFrames").disabled = true;
    cy.elements().remove();
    document.getElementById("Data").value="";
}

// показать полный путь
function showPath() {
    function makePopper(ele) {
        let ref = ele.popperRef();
        ele.tippy = tippy(ref, {
            content: () => {
                let content = document.createElement('div');
                content.innerHTML = ele.id();
                return content;
            },
            trigger: 'manual'
        });
    }
    cy.ready(function() {
        cy.elements().forEach(function(ele) {
            makePopper(ele);
        });
    })
    cy.elements().unbind('mouseover');
    cy.elements().bind('mouseover', (event) => event.target.tippy.show());
    cy.elements().unbind('mouseout');
    cy.elements().bind('mouseout', (event) => event.target.tippy.hide());
}