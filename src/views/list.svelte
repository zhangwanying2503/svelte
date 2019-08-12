<script>
export let list
export let countClick
export let removeClick
</script>

<style>
  .list_wrap {
    flex:1;
    height: 118px;
    display: flex;
    align-items: center;
  }
  .con1 {
    width: 80px;
    display: flex;
  }
  
  .shop_img {
    width: 80px;
    height: 80px;
    background: #fff;
  }
  .shop_img img {
    width: 80px;
    height: 80px;
  }
  .con2 {
    width: 208px;
    color: #666;
    font-size: 12px;
  }
  .conk {
    width: 170px;
    padding: 0 10px 0 20px;
    font-size: 12px;
  }
  .con3 {
    width: 120px;
    color: #333;
    font-size: 12px;
    padding-right: 40px;
    text-align: right;
  }
  .con4 {
    width: 80px;
    color: #666;
    font-size: 12px;
    text-align: center;
  }
  .con4_box{
        height: 22px;
    width: 80px;
    display: flex;
    background: #fff;
  }
  .con4_box span{
    width: 22px;
    height: 100%;
    border:1px solid #ddd;
    cursor: pointer;
  }
  .con4_box p{
    margin: 0;
    height: 100%;
    flex:1;
    border-top:1px solid #ddd;
    border-bottom:1px solid #ddd;
    display: flex;
    justify-content: center;
    align-items: center;
  }
  .con5 {
    width: 110px;
    color: #666;
    font-size: 12px;
    padding-right: 30px;
    text-align: right;
  }
  .con6 {
    width: 75px;
    color: #666;
    font-size: 12px;
  }
</style>

<div class="list_wrap">
  <div class="con1">
    <div class="shop_img">
      <img src={list.imgSrc} alt="" />
    </div>
  </div>

  <div class="con2">{list.shop_title}</div>

  <div class="conk">{list.shop_type}</div>
  <div class="con3">
    ￥
    <span>{list.price}</span>
  </div>
  <div class="con4">
      <div class="con4_box">
          <span data-id={list.id} type="remove" on:click={(event)=>{countClick(event)}}>-</span>
          <p>{list.count}</p>
          <span data-id={list.id} type="add" on:click={(event)=>{countClick(event)}}>+</span>
      </div>
  </div>
  <div class="con5">
    ￥
    <span>{list.price*list.count}</span>
  </div>
  <div class="con6" remove-id={list.id} on:click={(event)=>removeClick(event)}>删除</div>
</div>
