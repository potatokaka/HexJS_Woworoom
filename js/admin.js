let orderData = [];

const orderTable = document.querySelector(".orderPage-tableList");

// 取得訂單資料
function getOrder() {
  axios
    .get(orderUrl, {
      headers: {
        Authorization: token,
      },
    })
    .then((response) => {
      orderData = response.data.orders;
      // console.log(orderData);
      renderOrder(orderData);
      renderChart();
    })
    .catch((error) => {
      // console.log(error.response.data);
    });
}

// 渲染訂單畫面
function renderOrder(data) {
  let str = "";

  if (data.length == 0) {
    str = "目前沒有訂單";
  } else {
    data.forEach((item) => {
      // 印出產品名稱+數量
      let productStr = "";
      item.products.forEach((productItem) => {
        productStr += `
          <p>${productItem.title} x ${productItem.quantity}</p>
        `;
      });
      //console.log(productStr);

      // Timestamp 日期轉換
      let createdDate = new Date(item.createdAt * 1000);
      createdDate = createdDate.toLocaleDateString("zh-Hans-CN"); // '2021/9/14'

      str += `
            <tr>
                <td>${item.id}</td>
                <td>
                    <p>${item.user.name}</p>
                    <p>${item.user.tel}</p>
                </td>
                <td>${item.user.address}</td>
                <td>${item.user.email}</td>
                <td>
                    <p>${productStr}</p>
                </td>
                <td>${createdDate}</td>
                <td class="orderStatusAdmin">
                    <a href="#" class="paidButton js-edit" data-id=${item.id}>
                        ${item.paid ? "已處理" : "未處理"}
                    </a>
                </td>
                <td>
                    <input type="button" class="delSingleOrder-Btn js-delete" data-id=${
                      item.id
                    } value="刪除" />
                </td>
            </tr>
        `;
    });
  }

  orderTable.innerHTML = str;
}

// 刪除全部訂單
function deleteAllOrder() {
  const discardAllBtn = document.querySelector(".discardAllBtn");
  discardAllBtn.addEventListener("click", function (e) {
    e.preventDefault();

    // double check
    const alertMessage = confirm("是否確認要清除全部訂單?");
    if (alertMessage) {
      axios
        .delete(orderUrl, {
          headers: {
            Authorization: token,
          },
        })
        .then((response) => {
          alert(response.data.message);
          getOrder();
        })
        .catch((error) => {
          console.log(error.response.data.message);
        });
    }
  });
}

// 刪除單筆訂單
function deleteOrder() {
  orderTable.addEventListener("click", function (e) {
    e.preventDefault();
    const id = e.target.dataset.id;
    //console.log(id);
    if (!e.target.classList.contains("js-delete")) {
      return;
    } else {
      // Double Check
      const alertMessage = confirm("是否確認刪除該筆訂單?");
      if (alertMessage) {
        axios
          .delete(`${orderUrl}/${id}`, {
            headers: {
              Authorization: token,
            },
          })
          .then((response) => {
            alert("刪除成功");
            getOrder();
          })
          .catch((error) => {
            console.log(error.response.data);
          });
      }
    }
  });
}

//修改訂單狀態
function editOrder() {
  orderTable.addEventListener("click", function (e) {
    e.preventDefault();
    console.log(e.target);
    const id = e.target.dataset.id;

    // 依點選到的 id ，找出該筆訂單資料
    const orderItem = orderData.find((item) => {
      return item.id == id;
    });
    console.log(orderItem);

    const productObj = {
      data: {
        id: `${id}`,
        paid: orderItem.paid ? false : true,
      },
    };
    console.log(productObj);

    if (!e.target.classList.contains("js-edit")) {
      return;
    } else {
      axios
        .put(orderUrl, productObj, {
          headers: {
            Authorization: token,
          },
        })
        .then((response) => {
          getOrder();
          console.log("ooooo");
        })
        .catch((error) => {
          console.log(error.response.data);
        });
    }
  });
}

getOrder();
deleteAllOrder();
deleteOrder();
editOrder();

// C3.js
function renderChart() {
  if (orderData.length == 0) {
    const chart = document.querySelector("#chart");
    chart.textContent = `目前無訂單資料`;
    console.log(chart);
  } else {
    const orderCategory = {};
    orderData.forEach((item) => {
      // LV1
      // if (orderCategory[item.products[0].category] === undefined) {
      //   orderCategory[item.products[0].category] = 1;
      // } else {
      //   orderCategory[item.products[0].category] += 1;
      // }

      item.products.forEach((productItem) => {
        if (orderCategory[productItem.title] == undefined) {
          orderCategory[productItem.title] =
            productItem.quantity * productItem.price;
        } else {
          orderCategory[productItem.title] +=
            productItem.quantity * productItem.price;
        }
      });
    });
    // console.log(orderCategory); // LV1: {床架: 1, 窗簾: 1}
    // LV2: {Louvre 單人床架: 3780, Antony 遮光窗簾: 2400, Charles 系列儲物組合: 1560}

    // 拉出資料關聯
    let c3Arr = [];
    Object.keys(orderCategory).forEach((item, index) => {
      let tempArr = [];
      tempArr.push(item);
      tempArr.push(Object.values(orderCategory)[index]);
      c3Arr.push(tempArr);
    });

    //console.log(c3Arr); // Lv1 [ ['床架', 1], ['窗簾', 1]]
    // LV2 : [ ['Antony 床邊桌', 1800], ['Charles 系列儲物組合', 2000]]

    //  用 sort 將陣列依金額大排到小
    c3Arr.sort(function (a, b) {
      return b[1] - a[1];
    });

    // 如果筆數超過 4 筆以上，就統整為其它
    if (c3Arr.length > 3) {
      let otherAmount = 0;
      c3Arr.forEach((item, index) => {
        if (index > 2) {
          otherAmount += item[1];
        }
      });
      c3Arr.splice(3);
      c3Arr.push(["其他", otherAmount]);
      //console.log(c3Arr);
    }

    let chart = c3.generate({
      bindto: "#chart", // HTML 元素綁定
      data: {
        type: "pie",
        columns: c3Arr,
        //   columns: [
        //     ["Louvre 雙人床架", 1],
        //     ["Antony 雙人床架", 2],
        //     ["Anty 雙人床架", 3],
        //     ["其他", 4],
        //   ],
      },
      color: {
        pattern: ["#301E5F", "#5434A7", "#9D7FEA", "#DACBFF"],
      },
    });
  }
}
