let productData = [];
let cartData = [];
const productList = document.querySelector(".productWrap");
const cartTable = document.querySelector(".shoppingCart-tableList");
const form = document.querySelector(".orderInfo-form");

function init() {
  getProduct();
  getCart();
}

init();

// 取得產品資料
function getProduct() {
  axios
    .get(`${baseUrl}/customer/${api_path}/products`)
    .then((response) => {
      productData = response.data.products;
      //console.log(productData); // [{…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}]
      renderProduct(productData);
    })
    .catch((error) => {
      console.log(error.response.data);
    });
}

// 渲染產品卡片
function renderProduct(data) {
  let str = "";
  data.forEach((item) => {
    str += `
		<li class="productCard">
			<h4 class="productType">新品</h4>
			<img
				src="${item.images}"
				alt=""
			/>
			<a href="#" class="js-addCart addCardBtn" data-id="${item.id}">加入購物車</a>
			<h3>${item.title}</h3>
			<del class="originPrice">NT$${toThousands(item.origin_price)}</del>
			<p class="nowPrice">NT$${toThousands(item.price)}</p>
		</li>
	  `;
  });
  productList.innerHTML = str;
}

// 篩選產品
const productSelect = document.querySelector(".productSelect");

productSelect.addEventListener("change", filterProduct);
function filterProduct(e) {
  let filterData = productData.filter((item) => {
    if (e.target.value === "全部") {
      return item;
    } else if (e.target.value === item.category) {
      return item;
    }
  });

  renderProduct(filterData);
}

// 取得購物車商品
function getCart() {
  axios
    .get(`${baseUrl}/customer/${api_path}/carts`)
    .then((response) => {
      cartData = response.data;
      renderCart(cartData);
      deleteAllOrder();
      deleteOrder();
      patchProduct();
      //createOrder(); // 為什麼不能放裡面？
    })
    .catch((error) => {
      // console.log(error.response.data);
    });
}

// 渲染購物車
function renderCart(data) {
  const cartAmount = document.querySelector(".js-cartTotal");
  // console.log(data);

  let str = "";
  if (data.carts.length == 0) {
    // 如果購物車是空的
    str += `
			<tr>
				<td>
					購物車是空的
				</td>
			</tr>
	`;
  } else {
    cartData.carts.forEach((item) => {
      str += `
        <tr>
          <td>
            <div class="cardItem-title">
              <img src="${item.product.images}" alt="" />
              <p>${item.product.title}</p>
            </div>
          </td>
          <td>NT$${toThousands(item.product.origin_price)}</td>
          <td data-id=${item.id} data-num=${item.quantity} >
            <a class="btn border-0 p-0 js-patchMinus">
                <i class="material-icons ">remove</i>
            </a>
            <input type="text" value="${
              item.quantity
            }" class="text-center" style="width: 3rem">
            <a class="btn border-0 p-0 js-patchAdd">
                <i class="material-icons ">add</i>
            </a>
            
          </td>
          <td>NT$${toThousands(item.product.price)}</td>
          <td class="discardBtn">
            <a href="#" class="material-icons js-deleteOrder" data-id=${
              item.id
            }> clear </a>
          </td>
        </tr>
		`;
    });
  }
  cartTable.innerHTML = str;
  cartAmount.textContent = toThousands(data.finalTotal);
}

// 加入購物車
productList.addEventListener("click", addCart);

function addCart(e) {
  e.preventDefault();
  const id = e.target.dataset.id;
  let productQuantity = 0;

  // 檢查購物車是不是已有加入相同的產品，如果有，數量再 +1
  if (cartData.carts.length == 0) {
    // 如果購物車是空的時
    productQuantity = 1;
  } else {
    cartData.carts.forEach((item) => {
      if (item.product.id == id) {
        productQuantity = item.quantity + 1;
      } else {
        productQuantity += 1;
      }
    });
  }

  // 組合產品 obj 資料
  const productObj = {
    data: {
      productId: id,
      quantity: productQuantity,
    },
  };

  // console.log(productObj);

  // POST axios 購物車
  if (!e.target.classList.contains("js-addCart")) {
    return;
  } else {
    axios
      .post(`${baseUrl}/customer/${api_path}/carts`, productObj)
      .then((response) => {
        // console.log(response.data);
        Swal.fire({
          position: "center",
          icon: "success",
          title: "成功加入購物車",
          showConfirmButton: false,
          timer: 1500,
        });
        getCart();
      })
      .catch((error) => {
        console.log(error.response.data.message);
      });
  }
}

// 清除購物車內全部產品
function deleteAllOrder() {
  const discardAllBtn = document.querySelector(".discardAllBtn");
  //console.log(discardAllBtn);
  discardAllBtn.addEventListener("click", deleteCartAll);

  // 為什麼函式不能放外層？
  function deleteCartAll(e) {
    e.preventDefault();

    Swal.fire({
      title: "確定刪除所有品項?",
      showDenyButton: false,
      showCancelButton: true,
      confirmButtonText: "確定",
      // denyButtonText: `Don't save`,
      cancelButtonText: `取消`,
    }).then((result) => {
      /* Read more about isConfirmed, isDenied below */
      if (result.isConfirmed) {
        // API
        axios
          .delete(`${baseUrl}/customer/${api_path}/carts`)
          .then((response) => {
            // alert(response.data.message);
            Swal.fire("成功刪除", "", "success");
            getCart();
          })
          .catch((error) => {
            console.log(error.response.data.message);
          });
      } else if (result.isDenied) {
        Swal.fire("Changes are not saved", "", "info");
      }
    });

    // const alertMessage = confirm("確定刪除所有品項?");
    // if (alertMessage) {
    //   axios
    //     .delete(`${baseUrl}/customer/${api_path}/carts`)
    //     .then((response) => {
    //       alert(response.data.message);
    //       getCart();
    //     })
    //     .catch((error) => {
    //       console.log(error.response.data.message);
    //     });
    // } else {
    //   return;
    // }
  }
}

// 刪除購物車內特定產品
function deleteOrder() {
  cartTable.addEventListener("click", function (e) {
    e.preventDefault();
    const orderId = e.target.dataset.id;

    if (!e.target.classList.contains("js-deleteOrder")) {
      return;
    } else {
      Swal.fire({
        title: "是否確認要刪除該品項?",
        showDenyButton: false,
        showCancelButton: true,
        confirmButtonText: "確定",
        cancelButtonText: `取消`,
      }).then((result) => {
        /* Read more about isConfirmed, isDenied below */
        if (result.isConfirmed) {
          // API
          axios
            .delete(`${baseUrl}/customer/${api_path}/carts/${orderId}`)
            .then((response) => {
              Swal.fire("成功刪除", "", "success");
              cartData = response.data;
              renderCart(cartData);
              console.log(cartData);
            })
            .catch((error) => {
              console.log(error.response.data.message);
            });
        } else {
          return;
        }
      });
      // seperater----------------------------
      // const alertMessage = confirm("是否確認要刪除該品項?");
      // if (alertMessage) {
      //   axios
      //     .delete(`${baseUrl}/customer/${api_path}/carts/${orderId}`)
      //     .then((response) => {
      //       cartData = response.data;
      //       renderCart(cartData);
      //       console.log(cartData);
      //     })
      //     .catch((error) => {
      //       console.log(error.response.data.message);
      //     });
      // }
    }
  });
}

// 修改購物車中，商品的數量
function patchProduct() {
  cartTable.addEventListener("click", function (e) {
    e.preventDefault();

    const id = e.target.parentNode.parentNode.dataset.id;
    const num = e.target.parentNode.parentNode.dataset.num;
    let patchNum;

    if (e.target.parentNode.classList.contains("js-patchMinus")) {
      patchNum = parseInt(num) - 1;
      //console.log(patchNum);
    } else if (e.target.parentNode.classList.contains("js-patchAdd")) {
      patchNum = parseInt(num) + 1;
      //console.log(patchNum);
    }

    const productObj = {
      data: {
        id: id,
        quantity: patchNum,
      },
    };

    if (
      e.target.parentNode.classList.contains("js-patchMinus") ||
      e.target.parentNode.classList.contains("js-patchAdd")
    ) {
      axios
        .patch(`${baseUrl}/customer/${api_path}/carts`, productObj)
        .then((response) => {
          Swal.fire({
            position: "center",
            icon: "success",
            title: "修改數量成功",
            showConfirmButton: false,
            timer: 1500,
          });
          getCart();
        })
        .catch((error) => {
          Swal.fire({
            position: "center",
            icon: "warning",
            title: error.response.data.message,
            showConfirmButton: false,
            timer: 1500,
          });

          //alert(error.response.data.message);
        });
    }
  });
}

//送出購買訂單
function createOrder() {
  const createOrderBtn = document.querySelector(".orderInfo-btn");
  createOrderBtn.addEventListener("click", function (e) {
    e.preventDefault();

    if (cartData.carts.length === 0) {
      // alert("請將商品加入購物車");
      Swal.fire({
        position: "center",
        icon: "warning",
        title: "請將商品加入購物車",
        showConfirmButton: false,
        timer: 1500,
      });
      return;
    } else {
      validateForm(e);
    }
  });
}

// 表單驗證
const constraints = {
  姓名: {
    presence: {
      message: "為必填欄位",
    },
  },
  電話: {
    presence: {
      message: "為必填欄位",
      duration: {
        onlyInteger: true,
        minimum: 8,
        greaterThanOrEqualTo: 8,
        lessThanOrEqualTo: 10,
        message: "必須符合 8-10字數",
      },
    },
  },
  Email: {
    presence: {
      message: "為必填欄位",
    },
    email: {
      message: "錯誤格式",
    },
  },
  寄送地址: {
    presence: {
      message: "為必填欄位",
    },
  },
  交易方式: {
    presence: {
      message: "為必填欄位",
    },
  },
};

function validateForm(e) {
  e.preventDefault();

  let errors = validate(form, constraints); // 表單驗證
  // console.log(errors); // {姓名: Array(1), 電話: Array(1), Email: Array(1), 寄送地址: Array(1)}

  //取得錯誤訊息的 DOM元素
  const messageDisplay = document.querySelectorAll("[data-message]");

  if (errors !== undefined) {
    // undefined 代表是表單驗證都正確
    Object.keys(errors).forEach((item) => {
      document.querySelector(`[data-message="${item}"`).innerHTML = `
        ${errors[item]}
      `;
    });

    // 即時監聽 input
    inputCheck();
  } else {
    addOrder();

    messageDisplay.forEach((item) => {
      item.textContent = "";
    });
  }
}

// 按下送出之後，即時監聽 input，如正確輸入，則移除錯誤訊息
function inputCheck() {
  const inputs = document.querySelectorAll(
    'input[name="姓名"], input[name="電話"], input[name="Email"], input[name="寄送地址"]'
  );

  inputs.forEach((item) => {
    item.addEventListener("change", function () {
      let cacheErrors = validate(form, constraints) || {};
      //console.log(cacheErrors);

      if (cacheErrors[item.name]) {
        document.querySelector(`[data-message="${item.name}"]`).innerHTML = `
            ${cacheErrors[item.name]}
          `;
      } else {
        document.querySelector(`[data-message="${item.name}"]`).innerHTML = "";
      }
    });
  });
}

// 新增訂單 API Post
function addOrder() {
  const customerName = document.querySelector("#customerName").value.trim();
  const customerPhone = document.querySelector("#customerPhone").value.trim();
  const customerEmail = document.querySelector("#customerEmail").value.trim();
  const customerAddress = document
    .querySelector("#customerAddress")
    .value.trim();
  const tradeWay = document.querySelector("#tradeWay").value;

  const orderObj = {
    data: {
      user: {
        name: `${customerName}`,
        tel: `${customerPhone}`,
        email: `${customerEmail}`,
        address: `${customerAddress}`,
        payment: `${tradeWay}`,
      },
    },
  };

  axios
    .post(`${baseUrl}/customer/${api_path}/orders`, orderObj)
    .then((response) => {
      // console.log(response.data);
      // alert("成功送出訂單");
      Swal.fire({
        position: "center",
        icon: "success",
        title: "成功送出訂單",
        showConfirmButton: false,
        timer: 1500,
      });

      init();
      form.reset();
    })
    .catch((error) => {
      console.log(error.response.data.message);
    });
}

createOrder();
