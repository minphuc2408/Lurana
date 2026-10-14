import sqlite3, sys
from pathlib import Path

# Reference-only verifier for the proposed v2 schema, using in-memory SQLite.
# Phase 0 does not run this verifier, apply migrations, or replace docs/sql/MVP_SCHEMA.sql.
pipeline_dir = Path(__file__).resolve().parent
sql_dir = pipeline_dir.parent / "sql"
S=(pipeline_dir / "MVP_SCHEMA.sql").read_text(encoding="utf-8")
SEED=(sql_dir / "MVP_SEED_DEV.sql").read_text(encoding="utf-8")
D=(sql_dir / "deferred" / "0002_custom_requests.sql").read_text(encoding="utf-8")
db=sqlite3.connect(":memory:"); db.isolation_level=None
db.execute("PRAGMA foreign_keys=ON")
ok=fail=0
def t(name,cond):
    global ok,fail
    print(("PASS " if cond else "FAIL ")+name); ok+=cond; fail+=(not cond)
def raises(sql,args=(),kind=sqlite3.IntegrityError):
    try: db.execute(sql,args); return False
    except kind as e: return str(e)
db.executescript(S); db.executescript(S)
t("schema applies twice",True)
db.executescript(SEED); db.executescript(SEED)
cnt=lambda tb: db.execute(f"select count(*) from {tb}").fetchone()[0]
t("seed counts (cat4 prod8 var24 img8 zone4)",(cnt("categories"),cnt("products"),cnt("product_variants"),cnt("product_images"),cnt("delivery_zones"))==(4,8,24,8,4))
tables=[r[0] for r in db.execute("select name from sqlite_master where type='table' and name not like 'sqlite_%' order by 1")]
print("tables:",tables); t("10 tables",len(tables)==10)
t("integrity_check ok",db.execute("pragma integrity_check").fetchone()[0]=="ok")
t("foreign_key_check empty",db.execute("pragma foreign_key_check").fetchall()==[])

def order(num,key=None,sub=1000,disc=0,fee=0,tot=None,date="2026-10-20"):
    tot = sub-disc+fee if tot is None else tot
    return ("insert into orders(order_number,idempotency_key,sender_name,sender_phone,recipient_name,recipient_phone,province_name,ward_name,address_line,delivery_date,delivery_time_slot,subtotal,discount_total,delivery_fee,grand_total) values(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
            (num,key,"A","0900000000","B","0911111111","P","W","1 X",date,"08:00-10:00",sub,disc,fee,tot))
# totals
t("total formula CHECK rejects mismatch",bool(raises(*order("O1",tot=999))))
t("discount<=subtotal CHECK",bool(raises(*order("O2",sub=100,disc=200,tot=0))))
t("delivery_date format CHECK",bool(raises(*order("O3",date="2026-1-5"))))
# idempotency
db.execute(*order("O10",key="k1",fee=35000));
t("idempotency unique",bool(raises(*order("O11",key="k1"))))
db.execute(*order("O12")); db.execute(*order("O13"))
t("multiple NULL idempotency keys allowed",True)
t("order_number unique",bool(raises(*order("O10"))))
# stock rollback
vid=db.execute("select id from product_variants where sku='BPB-L'").fetchone()[0]
before=db.execute("select stock_quantity from product_variants where id=?",(vid,)).fetchone()[0]
db.execute("BEGIN")
db.execute(*order("O20",key="k20"))
oid=db.execute("select id from orders where order_number='O20'").fetchone()[0]
db.execute("insert into order_items(order_id,product_id,variant_id,sku_snapshot,name_vi_snapshot,name_en_snapshot,size_snapshot,unit_price,quantity,line_total) values(?,?,?,?,?,?,?,?,?,?)",(oid,1,vid,"BPB-L","a","b","L",1000,11,11000))
e=raises("update product_variants set stock_quantity = stock_quantity - ? where id=?",(11,vid))
db.execute("ROLLBACK")
t("oversell blocked by CHECK (stock 10, buy 11)",bool(e) and "CHECK" in e)
t("rollback leaves no order and stock intact",db.execute("select count(*) from orders where order_number='O20'").fetchone()[0]==0 and db.execute("select stock_quantity from product_variants where id=?",(vid,)).fetchone()[0]==before)
t("line_total CHECK",bool(raises("insert into order_items(order_id,sku_snapshot,name_vi_snapshot,name_en_snapshot,size_snapshot,unit_price,quantity,line_total) values(1,'a','b','c','S',1000,2,5)")))
# snapshot survives product delete
db.execute("insert into order_items(order_id,product_id,variant_id,sku_snapshot,name_vi_snapshot,name_en_snapshot,size_snapshot,unit_price,quantity,line_total) select 1,p.id,v.id,v.sku,p.name_vi,p.name_en,v.size_code,v.price,1,v.price from product_variants v join products p on p.id=v.product_id where v.sku='DLB-S'")
pid=db.execute("select id from products where slug='dried-lavender-bundle'").fetchone()[0]
db.execute("delete from products where id=?",(pid,))
r=db.execute("select variant_id,product_id,sku_snapshot from order_items where sku_snapshot='DLB-S'").fetchone()
t("delete product -> order item keeps snapshot, FKs null",r==(None,None,"DLB-S"))
# category restrict
t("category delete restricted",bool(raises("delete from categories where code='bouquets'")))
# partial uniques
pid2=db.execute("select id from products where slug='blush-peony-bouquet'").fetchone()[0]
t("second primary image rejected",bool(raises("insert into product_images(product_id,image_url,is_primary) values(?,?,1)",(pid2,"u"))))
db.execute("insert into product_images(product_id,image_url,is_primary) values(?,?,0)",(pid2,"u2"))
db.execute("insert into users(email,full_name) values('a@b.vn','A')")
db.execute("insert into user_addresses(user_id,recipient_name,recipient_phone,province_name,ward_name,address_line,is_default) values(1,'a','0','p','w','l',1)")
t("second default address rejected",bool(raises("insert into user_addresses(user_id,recipient_name,recipient_phone,province_name,ward_name,address_line,is_default) values(1,'a','0','p','w','l',1)")))
t("uppercase email rejected",bool(raises("insert into users(email,full_name) values('X@B.VN','X')")))
t("duplicate email rejected",bool(raises("insert into users(email,full_name) values('a@b.vn','A2')")))
# variants
t("compare_at < price rejected",bool(raises("update product_variants set compare_at_price=1 where sku='BPB-S'")))
t("duplicate product+size rejected",bool(raises("insert into product_variants(product_id,sku,size_code,price) values(?,?,?,?)",(pid2,"NEW-S","S",1))))
t("unknown size rejected",bool(raises("insert into product_variants(product_id,sku,size_code,price) values(?,?,?,?)",(pid2,"NEW-X","XL",1))))
# zones
t("zone unique (province,'' )",bool(raises("insert into delivery_zones(province_name,ward_name,fee) values('Thành phố Hà Nội','',1)")))
fee=db.execute("select fee from delivery_zones where province_name='Thành phố Hà Nội' and ward_name in ('Phường Hoàn Kiếm','') order by ward_name desc limit 1").fetchone()[0]
t("zone lookup prefers ward over province default",fee==20000)
# payment method only COD
t("non-COD rejected",bool(raises("update orders set payment_method='MOMO' where id=1")))
# deferred
db.executescript(D); db.executescript(D)
t("deferred 0002 applies twice after 0001",True)
t("custom_requests json_valid CHECK",bool(raises("insert into custom_requests(reference_code,contact_name,contact_phone,needed_date,color_codes) values('CR1','a','0','2026-10-20','not json')")))
print(f"\n{ok} passed, {fail} failed"); sys.exit(1 if fail else 0)
